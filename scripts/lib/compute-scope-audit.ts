import {
  ANALYSIS_ENGINE_VERSION,
  type AnalysisContext,
  getAnalysisContextKey
} from "@/api/service/analysis-snapshot/analysis-context";
import {
  ANALYSIS_SCOPE_SEMANTICS,
  listAnalysisContexts
} from "@/api/service/analysis-snapshot/context-plan";
import {
  type EligibleSampleDraw,
  replayEligibleSampleFromDraws,
  selectEligibleDraws
} from "@/api/service/analysis-snapshot/eligible-sample";

export type ScopeAuditDraw = EligibleSampleDraw;

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
  | "month_scope_leak"
  | "year_scope_leak"
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
        "resolveAnalysisSample (full scope, no LIMIT) → buildAnalyticsReadModelFromPrizes → pattern + calendar read models → analysis_snapshot_runs",
      scope: ANALYSIS_SCOPE_SEMANTICS,
      windowPreset: "ALL — windowSize stored equals sampleDrawCount"
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
  const eligibleDraws = selectEligibleDraws(draws, context);
  const liveSample = replayEligibleSampleFromDraws(draws, context);
  const expectedSampleDrawCount = liveSample.drawCount;
  const liveSampleDrawCount = liveSample.drawCount;
  const liveSamplePrizeCount = liveSample.prizeCount;
  const invalidPrizeCountLive = liveSample.invalidPrizeCount;
  const expectedWindowSizeStored = liveSampleDrawCount;
  const issues: string[] = [];
  let status: ContextAuditStatus = "ok";

  if (eligibleDraws.length === 0) {
    status = "zero_eligible";
    issues.push("No eligible draws in scope for this prize filter.");
  }

  if (context.scope === "MONTH" && context.month) {
    const monthLeak = eligibleDraws.some(
      (draw) => draw.drawDate.getUTCMonth() + 1 !== context.month
    );

    if (monthLeak) {
      status = "month_scope_leak";
      issues.push("Sample contains drawDate outside configured UTC month.");
    }

    if (context.year !== undefined) {
      const yearLeak = eligibleDraws.some(
        (draw) => draw.drawDate.getUTCFullYear() !== context.year
      );

      if (yearLeak) {
        status = "year_scope_leak";
        issues.push("Sample contains drawDate outside configured UTC year.");
      }
    }
  }

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
        status = status === "ok" ? "draw_count_mismatch" : status;
        issues.push(
          `Snapshot windowSize=${snapshot.windowSize ?? "null"} vs sampleDrawCount=${expectedWindowSizeStored}.`
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
    configuredDrawCap: null,
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
    windowPreset: context.windowPreset
  };
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
  const byWindowPreset = new Map<string, { ok: number; fail: number }>();

  for (const row of rows) {
    byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);

    const bucket = byWindowPreset.get(row.windowPreset) ?? { fail: 0, ok: 0 };

    if (row.status === "ok" || row.status === "zero_eligible") {
      bucket.ok += 1;
    } else {
      bucket.fail += 1;
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
    zeroEligibleCount: rows.filter((row) => row.status === "zero_eligible").length
  };
}

export function buildComputeScopeMarkdown(report: ReturnType<typeof buildComputeScopeAuditReport>) {
  const { summary } = report;

  return `# Compute scope & snapshot audit

Generated: ${report.generatedAt}

## Window semantics

${report.semantics.windowPreset}

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
