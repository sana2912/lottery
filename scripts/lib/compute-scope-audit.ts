import {
  ANALYSIS_ENGINE_VERSION,
  type AnalysisContext,
  getAnalysisContextKey,
  getAnalysisPrizeNumberLength,
  getAnalysisWindowLimit
} from "@/api/service/analysis-snapshot/analysis-context";
import {
  ANALYSIS_SCOPE_SEMANTICS,
  ANALYSIS_WINDOW_SEMANTICS,
  listAnalysisContexts
} from "@/api/service/analysis-snapshot/context-plan";
import {
  matchesAnalysisPrizeSample,
  toAnalysisPrizeTypeLabel
} from "@/api/service/analysis-snapshot/prize-sample-types";

export type ScopeAuditDraw = {
  drawDate: Date;
  drawNo: string | null;
  prizes: Array<{
    number: string;
    position: number | null;
    type: string;
  }>;
};

export type ScopeAuditSnapshot = {
  computedAt: Date;
  contextKey: string;
  endDrawDate: Date | null;
  engineVersion: string;
  invalidPrizeCount: number;
  month: number | null;
  prizeType: string;
  sampleDrawCount: number;
  samplePrizeCount: number;
  scope: string;
  startDrawDate: Date | null;
  windowPreset: string;
  windowSize: number | null;
};

export type ContextAuditStatus =
  | "ok"
  | "missing_snapshot"
  | "legacy_engine"
  | "draw_count_mismatch"
  | "prize_count_mismatch"
  | "window_size_mismatch"
  | "month_scope_leak"
  | "zero_eligible"
  | "db_resolver_mismatch";

export type ContextAuditRow = {
  configuredDrawCap: number | null;
  contextKey: string;
  eligibleDrawCount: number;
  expectedSampleDrawCount: number;
  expectedWindowSizeStored: number | null;
  invalidPrizeCountLive: number;
  issues: string[];
  liveSampleDrawCount: number;
  liveSamplePrizeCount: number;
  month: number | null;
  prizeType: string;
  scope: string;
  snapshotSampleDrawCount: number | null;
  snapshotSamplePrizeCount: number | null;
  snapshotWindowSize: number | null;
  status: ContextAuditStatus;
  underfilledWindow: boolean;
  windowPreset: string;
};

export type PrizeYearProfile = {
  drawCount: number;
  expectedRowsPerDraw: number | null;
  maxRowsPerDraw: number;
  minRowsPerDraw: number;
  prizeType: string;
  rowsBelowExpectedDrawCount: number;
  year: number;
};

export const EXPECTED_PRIZE_ROWS_PER_DRAW: Record<string, number | null> = {
  FIRST: 1,
  NEAR_FIRST: 2,
  OTHER: null,
  PRIZE2: 5,
  PRIZE3: 10,
  PRIZE4: 50,
  PRIZE5: 100,
  THREE_BACK: 2,
  THREE_DIGIT: null,
  THREE_FRONT: 2,
  TWO_DIGIT: 1
};

export function buildComputeScopeAuditReport(input: {
  draws: readonly ScopeAuditDraw[];
  snapshots: readonly ScopeAuditSnapshot[];
  dbSpotChecks?: ReadonlyMap<string, { drawCount: number; prizeCount: number }>;
}) {
  const contexts = listAnalysisContexts();
  const snapshotByKey = new Map(input.snapshots.map((snapshot) => [snapshot.contextKey, snapshot]));
  const contextRows = contexts.map((context) =>
    auditContext(
      context,
      input.draws,
      snapshotByKey.get(getAnalysisContextKey(context)),
      input.dbSpotChecks
    )
  );
  const prizeProfilesByYear = buildPrizeProfilesByYear(input.draws);
  const summary = summarizeContextRows(contextRows);

  return {
    contextRows,
    generatedAt: new Date().toISOString(),
    prizeProfilesByYear,
    semantics: {
      computePipeline:
        "resolveAnalysisSample → buildAnalyticsReadModelFromPrizes(windowSize = cap ?? sampleDrawCount) → pattern + calendar read models → analysis_snapshot_runs",
      scope: ANALYSIS_SCOPE_SEMANTICS,
      windowPreset: ANALYSIS_WINDOW_SEMANTICS
    },
    summary
  };
}

export function auditContext(
  context: AnalysisContext,
  draws: readonly ScopeAuditDraw[],
  snapshot: ScopeAuditSnapshot | undefined,
  dbSpotChecks?: ReadonlyMap<string, { drawCount: number; prizeCount: number }>
): ContextAuditRow {
  const configuredDrawCap = getAnalysisWindowLimit(context.windowPreset) ?? null;
  const eligibleDraws = selectEligibleDraws(draws, context);
  const sampleDraws = applyWindowCap(eligibleDraws, configuredDrawCap);
  const livePrizes = sampleDraws.flatMap((draw) =>
    filterValidPrizes(draw.prizes, context).map((prize) => ({
      drawDate: draw.drawDate,
      number: prize.number
    }))
  );
  const expectedSampleDrawCount = sampleDraws.length;
  const liveSampleDrawCount = expectedSampleDrawCount;
  const liveSamplePrizeCount = livePrizes.length;
  const invalidPrizeCountLive = countInvalidLength(draws, context, sampleDraws);
  const expectedWindowSizeStored = configuredDrawCap;
  const issues: string[] = [];
  let status: ContextAuditStatus = "ok";

  if (eligibleDraws.length === 0) {
    status = "zero_eligible";
    issues.push("No eligible draws in scope for this prize filter.");
  }

  if (context.scope === "MONTH" && context.month) {
    const leak = livePrizes.some((prize) => prize.drawDate.getUTCMonth() + 1 !== context.month);

    if (leak) {
      status = "month_scope_leak";
      issues.push("Sample contains drawDate outside configured UTC month.");
    }
  }

  if (
    configuredDrawCap &&
    eligibleDraws.length > configuredDrawCap &&
    liveSampleDrawCount !== configuredDrawCap
  ) {
    issues.push(
      `Window cap ${configuredDrawCap} but live sample has ${liveSampleDrawCount} draws (eligible=${eligibleDraws.length}).`
    );
  }

  const underfilledWindow = Boolean(
    configuredDrawCap && eligibleDraws.length > 0 && liveSampleDrawCount < configuredDrawCap
  );

  if (!snapshot && eligibleDraws.length > 0 && status !== "month_scope_leak") {
    status = "missing_snapshot";
    issues.push("No analysis_snapshot_runs row for this contextKey.");
  } else if (snapshot) {
    if (snapshot.engineVersion !== ANALYSIS_ENGINE_VERSION) {
      status = "legacy_engine";
      issues.push(`Snapshot engineVersion=${snapshot.engineVersion}.`);
    } else {
      if (snapshot.sampleDrawCount !== liveSampleDrawCount) {
        status = "draw_count_mismatch";
        issues.push(
          `Snapshot sampleDrawCount=${snapshot.sampleDrawCount} vs live=${liveSampleDrawCount}.`
        );
      }

      if (snapshot.samplePrizeCount !== liveSamplePrizeCount) {
        status = status === "ok" ? "prize_count_mismatch" : status;
        issues.push(
          `Snapshot samplePrizeCount=${snapshot.samplePrizeCount} vs live=${liveSamplePrizeCount}.`
        );
      }

      if (snapshot.windowSize !== expectedWindowSizeStored) {
        status = status === "ok" ? "window_size_mismatch" : status;
        issues.push(
          `Snapshot windowSize=${snapshot.windowSize ?? "null"} vs expected=${expectedWindowSizeStored ?? "null"}.`
        );
      }
    }
  }

  const dbCheck = dbSpotChecks?.get(getAnalysisContextKey(context));

  if (dbCheck) {
    if (dbCheck.drawCount !== liveSampleDrawCount || dbCheck.prizeCount !== liveSamplePrizeCount) {
      status = "db_resolver_mismatch";
      issues.push(
        `resolveAnalysisSample draw=${dbCheck.drawCount} prize=${dbCheck.prizeCount} differs from in-memory replay.`
      );
    }
  }

  if (issues.length === 0 && eligibleDraws.length > 0 && status !== "legacy_engine") {
    status = "ok";
  }

  return {
    configuredDrawCap,
    contextKey: getAnalysisContextKey(context),
    eligibleDrawCount: eligibleDraws.length,
    expectedSampleDrawCount,
    expectedWindowSizeStored,
    invalidPrizeCountLive,
    issues,
    liveSampleDrawCount,
    liveSamplePrizeCount,
    month: context.month ?? null,
    prizeType: context.prizeType,
    scope: context.scope,
    snapshotSampleDrawCount: snapshot?.sampleDrawCount ?? null,
    snapshotSamplePrizeCount: snapshot?.samplePrizeCount ?? null,
    snapshotWindowSize: snapshot?.windowSize ?? null,
    status,
    underfilledWindow,
    windowPreset: context.windowPreset
  };
}

export function selectEligibleDraws(draws: readonly ScopeAuditDraw[], context: AnalysisContext) {
  return draws.filter((draw) => {
    if (context.scope === "MONTH" && draw.drawDate.getUTCMonth() + 1 !== context.month) {
      return false;
    }

    return filterPrizesForContext(draw.prizes, context).length > 0;
  });
}

export function applyWindowCap<T extends { drawDate: Date }>(
  draws: readonly T[],
  cap: number | null
): T[] {
  const newestFirst = [...draws].sort(
    (left, right) => right.drawDate.getTime() - left.drawDate.getTime()
  );
  const windowed = cap ? newestFirst.slice(0, cap) : newestFirst;

  return windowed.sort((left, right) => left.drawDate.getTime() - right.drawDate.getTime());
}

function filterPrizesForContext(prizes: ScopeAuditDraw["prizes"], context: AnalysisContext) {
  return prizes.filter((prize) =>
    matchesAnalysisPrizeSample(
      { position: prize.position, type: prize.type },
      { prizeType: context.prizeType }
    )
  );
}

function filterValidPrizes(prizes: ScopeAuditDraw["prizes"], context: AnalysisContext) {
  const numberLength = getAnalysisPrizeNumberLength(context.prizeType);

  return filterPrizesForContext(prizes, context)
    .filter((prize) => prize.number.length === numberLength)
    .map((prize) => ({
      ...prize,
      type: toAnalysisPrizeTypeLabel(
        { position: prize.position, type: prize.type },
        { prizeType: context.prizeType }
      )
    }));
}

function countInvalidLength(
  _draws: readonly ScopeAuditDraw[],
  context: AnalysisContext,
  sampleDraws: readonly ScopeAuditDraw[]
) {
  let invalid = 0;

  for (const draw of sampleDraws) {
    const matched = filterPrizesForContext(draw.prizes, context);
    const valid = filterValidPrizes(draw.prizes, context);

    invalid += matched.length - valid.length;
  }

  return invalid;
}

function buildPrizeProfilesByYear(draws: readonly ScopeAuditDraw[]): PrizeYearProfile[] {
  const prizeTypes = [
    "FIRST",
    "NEAR_FIRST",
    "PRIZE2",
    "PRIZE3",
    "PRIZE4",
    "PRIZE5",
    "THREE_DIGIT",
    "THREE_FRONT",
    "THREE_BACK",
    "TWO_DIGIT"
  ] as const;
  const years = [...new Set(draws.map((draw) => draw.drawDate.getUTCFullYear()))].sort(
    (left, right) => left - right
  );
  const profiles: PrizeYearProfile[] = [];

  for (const year of years) {
    const yearDraws = draws.filter((draw) => draw.drawDate.getUTCFullYear() === year);

    for (const prizeType of prizeTypes) {
      const expectedRowsPerDraw = EXPECTED_PRIZE_ROWS_PER_DRAW[prizeType] ?? null;
      const counts = yearDraws.map(
        (draw) => draw.prizes.filter((prize) => prize.type === prizeType).length
      );
      const present = counts.filter((count) => count > 0);

      profiles.push({
        drawCount: yearDraws.length,
        expectedRowsPerDraw,
        maxRowsPerDraw: present.length > 0 ? Math.max(...present) : 0,
        minRowsPerDraw: present.length > 0 ? Math.min(...present) : 0,
        prizeType,
        rowsBelowExpectedDrawCount:
          expectedRowsPerDraw === null
            ? 0
            : counts.filter((count) => count > 0 && count < expectedRowsPerDraw).length,
        year
      });
    }
  }

  return profiles;
}

function summarizeContextRows(rows: readonly ContextAuditRow[]) {
  const byStatus = new Map<ContextAuditStatus, number>();
  const byWindowPreset = new Map<string, { ok: number; fail: number; underfilled: number }>();

  for (const row of rows) {
    byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);

    const bucket = byWindowPreset.get(row.windowPreset) ?? { fail: 0, ok: 0, underfilled: 0 };

    if (row.status === "ok" || row.status === "zero_eligible") {
      bucket.ok += 1;
    } else {
      bucket.fail += 1;
    }

    if (row.underfilledWindow) {
      bucket.underfilled += 1;
    }

    byWindowPreset.set(row.windowPreset, bucket);
  }

  return {
    byStatus: Object.fromEntries(byStatus),
    byWindowPreset: Object.fromEntries(byWindowPreset),
    failureExamples: rows
      .filter((row) => row.status !== "ok" && row.status !== "zero_eligible")
      .slice(0, 40),
    totalContexts: rows.length,
    underfilledWindowExamples: rows.filter((row) => row.underfilledWindow).slice(0, 30),
    zeroEligibleCount: rows.filter((row) => row.status === "zero_eligible").length
  };
}

export function buildComputeScopeMarkdown(report: ReturnType<typeof buildComputeScopeAuditReport>) {
  const { summary } = report;

  return `# Compute scope & snapshot audit

Generated: ${report.generatedAt}

## Window preset semantics

| Preset | Draw cap | Meaning |
| --- | --- | --- |
${Object.entries(report.semantics.windowPreset)
  .map(([preset, meta]) => `| ${preset} | ${meta.drawCap ?? "none"} | ${meta.weightNote} |`)
  .join("\n")}

## Summary

- Contexts audited: **${summary.totalContexts}**
- Zero eligible (expected for sparse MONTH cells): **${summary.zeroEligibleCount}**
- Status counts: ${JSON.stringify(summary.byStatus)}
- By window: ${JSON.stringify(summary.byWindowPreset)}

## Failures (sample)

${
  summary.failureExamples.length > 0
    ? summary.failureExamples
        .map(
          (row) =>
            `- \`${row.contextKey}\` **${row.status}**: ${row.issues.join(" ")} (eligible=${row.eligibleDrawCount}, live draws=${row.liveSampleDrawCount}, snapshot draws=${row.snapshotSampleDrawCount ?? "—"})`
        )
        .join("\n")
    : "- None"
}

## Under-filled windows (cap not reached)

${
  summary.underfilledWindowExamples.length > 0
    ? summary.underfilledWindowExamples
        .slice(0, 15)
        .map(
          (row) =>
            `- ${row.prizeType} ${row.scope} month=${row.month ?? "ALL"} window=${row.windowPreset}: ${row.liveSampleDrawCount}/${row.configuredDrawCap} eligible draws`
        )
        .join("\n")
    : "- None in sampled failures list"
}

## Historical prize row density (by year)

| Year | Prize | Draws | Min rows | Max rows | Below expected |
| --- | --- | --- | --- | --- | --- |
${report.prizeProfilesByYear
  .filter((row) => row.maxRowsPerDraw > 0)
  .slice(-60)
  .map(
    (row) =>
      `| ${row.year} | ${row.prizeType} | ${row.drawCount} | ${row.minRowsPerDraw} | ${row.maxRowsPerDraw} | ${row.rowsBelowExpectedDrawCount} |`
  )
  .join("\n")}

## Re-run

\`\`\`bash
bun run db:audit:scope
bun run db:audit:draw-prizes
\`\`\`
`;
}
