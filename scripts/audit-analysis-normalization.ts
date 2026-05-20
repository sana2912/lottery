import { ANALYSIS_ENGINE_VERSION } from "@/api/service/analysis-snapshot/analysis-context";
import {
  getPrizeTypesForSampleQuery,
  matchesAnalysisPrizeSample
} from "@/api/service/analysis-snapshot/prize-sample-types";
import { buildPositionHeatmapRows } from "@/api/service/analytics/position-heatmap";
import { getPrisma } from "@/api/service/prisma";
import { parseCliValues, printOrWriteJsonReport, writeTextReport } from "./audit-utils";
import {
  buildNormalizationAuditMarkdown,
  type NormalizationAuditReport
} from "./lib/normalization-audit-markdown";

const LOTTERY_TYPE = "THAI_GOVERNMENT";
const DEFAULT_OUT = "reports/audit/analysis-normalization.json";
const DEFAULT_REPORT_OUT = "reports/audit/normalization-system-audit.md";
const WINDOW_PRESETS = ["50", "100", "500", "ALL"] as const;
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const PRIZE_TYPES = [
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "THREE_DIGIT",
  "THREE_FRONT",
  "THREE_BACK",
  "TWO_DIGIT",
  "OTHER"
] as const;
const ANALYSIS_PRIZE_TYPES = [
  "TWO_DIGIT",
  "THREE_DIGIT",
  "THREE_FRONT",
  "THREE_BACK",
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "SIX_DIGIT_ALL"
] as const;
const SIX_DIGIT_SOURCE_PRIZE_TYPES = [
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5"
] as const;
const CALENDAR_DIAGNOSTIC_PRIZE_TYPES = [
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "SIX_DIGIT_ALL"
] as const;
const MATRIX_DIAGNOSTIC_MONTHS = [1, 5, 12] as const;
const MATRIX_DIAGNOSTIC_SCOPES = ["ALL_TIME", "MONTH"] as const;
const EXPECTED_ROWS_PER_DRAW = {
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
} satisfies Record<PrizeType, number | null>;

type PrizeType = (typeof PRIZE_TYPES)[number];
type AnalysisPrizeType = (typeof ANALYSIS_PRIZE_TYPES)[number];
type WindowPreset = (typeof WINDOW_PRESETS)[number];
type DrawRow = Awaited<ReturnType<typeof loadDraws>>[number];
type PrizeRow = DrawRow["prizes"][number];
type SnapshotRow = {
  computedAt: Date;
  contextKey: string;
  engineVersion: string;
  invalidPrizeCount: number;
  lotteryType: string;
  month: number | null;
  numberLength: number;
  prizeType: string;
  sampleDrawCount: number;
  samplePrizeCount: number;
  scope: string;
  windowPreset: string;
  windowSize: number | null;
};

type CliOptions = {
  out: string;
  report: boolean;
  reportOut: string;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const prisma = getPrisma();
  const warnings: string[] = [];

  try {
    const draws = await loadDraws(prisma);
    const snapshots = await loadSnapshots(prisma, warnings);
    const report = buildReport(draws, snapshots, warnings);

    await printOrWriteJsonReport({
      out: options.out,
      value: report
    });

    if (options.report) {
      const markdown = buildNormalizationAuditMarkdown(report as NormalizationAuditReport);
      const resolvedPath = await writeTextReport(options.reportOut, markdown);

      console.info(`Audit markdown written to ${resolvedPath}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Analysis normalization audit failed: ${message}`);
  process.exitCode = 1;
});

function parseArgs(args: readonly string[]): CliOptions {
  const values = parseCliValues(args);

  return {
    out: values.out ?? DEFAULT_OUT,
    report: values.report === "true",
    reportOut: values["report-out"] ?? DEFAULT_REPORT_OUT
  };
}

async function loadDraws(prisma: ReturnType<typeof getPrisma>) {
  return prisma.lotteryDraw.findMany({
    include: {
      prizes: {
        orderBy: [{ type: "asc" }, { position: "asc" }, { number: "asc" }],
        select: {
          number: true,
          position: true,
          type: true
        }
      }
    },
    orderBy: {
      drawDate: "asc"
    },
    where: {
      drawDate: {
        lte: new Date()
      },
      lotteryType: LOTTERY_TYPE
    }
  });
}

async function loadSnapshots(
  prisma: ReturnType<typeof getPrisma>,
  warnings: string[]
): Promise<SnapshotRow[]> {
  try {
    return await prisma.$queryRaw<SnapshotRow[]>`
      SELECT
        "contextKey",
        "lotteryType"::text AS "lotteryType",
        "prizeType",
        "numberLength",
        "scope",
        "month",
        "windowPreset",
        "windowSize",
        "sampleDrawCount",
        "samplePrizeCount",
        "invalidPrizeCount",
        "engineVersion",
        "computedAt"
      FROM "analysis_snapshot_runs"
      ORDER BY "prizeType" ASC, "scope" ASC, "month" ASC NULLS FIRST, "windowPreset" ASC
    `;
  } catch (error) {
    warnings.push(`Could not read analysis snapshots: ${getErrorMessage(error)}`);

    return [];
  }
}

function buildReport(
  draws: readonly DrawRow[],
  snapshots: readonly SnapshotRow[],
  warnings: string[]
) {
  const dateRange = getDateRange(draws);
  const prizeProfiles = buildPrizeProfiles(draws);
  const calendarHeatmapDiagnostics = buildCalendarHeatmapDiagnostics(draws);
  const heatmapMatrixDiagnostics = buildHeatmapMatrixDiagnostics(draws);
  const numberStatsMatrixDiagnostics = buildNumberStatsMatrixDiagnostics(draws);

  warnings.push(...buildCalendarHeatmapWarnings(calendarHeatmapDiagnostics));
  warnings.push(...buildHeatmapMatrixWarnings(heatmapMatrixDiagnostics));

  return {
    generatedAt: new Date().toISOString(),
    database: {
      dateRange,
      drawCount: draws.length,
      lotteryType: LOTTERY_TYPE,
      prizeRowCount: draws.reduce((total, draw) => total + draw.prizes.length, 0)
    },
    prizeProfiles,
    lengthProfiles: buildLengthProfiles(draws),
    sixDigitAllProfile: buildSixDigitAllProfile(draws),
    windowSamples: buildWindowSamples(draws),
    calendarHeatmapDiagnostics,
    heatmapMatrixDiagnostics,
    numberStatsDiagnostics: buildNumberStatsDiagnostics(draws),
    numberStatsMatrixDiagnostics,
    threeDigitPrizeDecision: buildThreeDigitPrizeDecision(prizeProfiles),
    moduleAudit: buildModuleAudit(),
    snapshotCoverage: buildSnapshotCoverage(snapshots),
    warnings
  };
}

function buildPrizeProfiles(draws: readonly DrawRow[]) {
  return PRIZE_TYPES.map((prizeType) => {
    const expectedRowsPerDraw = EXPECTED_ROWS_PER_DRAW[prizeType];
    const counts = draws.map((draw) => countPrizes(draw.prizes, [prizeType]));
    const positiveCounts = counts.filter((count) => count > 0);
    const anomalousDraws =
      expectedRowsPerDraw === null
        ? []
        : draws
            .map((draw, index) => ({
              actual: counts[index],
              drawDate: formatDate(draw.drawDate),
              drawNo: draw.drawNo ?? null,
              expected: expectedRowsPerDraw
            }))
            .filter((row) => row.actual !== row.expected)
            .slice(0, 20);

    return {
      averageRowsPerDraw: round(average(counts)),
      averageRowsPerPresentDraw: round(average(positiveCounts)),
      drawCount: draws.length,
      drawCountWithPrize: positiveCounts.length,
      drawsAboveExpected:
        expectedRowsPerDraw === null
          ? null
          : counts.filter((count) => count > expectedRowsPerDraw).length,
      drawsBelowExpected:
        expectedRowsPerDraw === null
          ? null
          : counts.filter((count) => count < expectedRowsPerDraw).length,
      expectedRowsPerDraw,
      maxRowsPerDraw: Math.max(0, ...counts),
      minRowsPerDraw: positiveCounts.length > 0 ? Math.min(...positiveCounts) : 0,
      prizeType,
      sampleAnomalies: anomalousDraws,
      totalRows: sum(counts),
      zeroRowDrawCount: counts.filter((count) => count === 0).length
    };
  });
}

function buildLengthProfiles(draws: readonly DrawRow[]) {
  const counts = new Map<string, number>();

  for (const draw of draws) {
    for (const prize of draw.prizes) {
      const key = `${toPrizeType(prize.type)}|${prize.number.length}`;

      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return PRIZE_TYPES.map((prizeType) => ({
    expectedNumberLength: getExpectedNumberLength(prizeType),
    lengths: [...counts.entries()]
      .filter(([key]) => key.startsWith(`${prizeType}|`))
      .map(([key, count]) => ({
        count,
        length: Number(key.split("|")[1])
      }))
      .sort((left, right) => left.length - right.length),
    prizeType
  }));
}

function buildSixDigitAllProfile(draws: readonly DrawRow[]) {
  const expectedRowsPerDraw = SIX_DIGIT_SOURCE_PRIZE_TYPES.reduce(
    (total, prizeType) => total + (EXPECTED_ROWS_PER_DRAW[prizeType] ?? 0),
    0
  );
  const totalCounts = draws.map((draw) => countPrizes(draw.prizes, SIX_DIGIT_SOURCE_PRIZE_TYPES));
  const validCounts = draws.map(
    (draw) =>
      filterPrizesForAnalysis(draw.prizes, "SIX_DIGIT_ALL").filter(
        (prize) => prize.number.length === 6
      ).length
  );

  return {
    averageRowsPerDraw: round(average(totalCounts)),
    averageValidSixDigitRowsPerDraw: round(average(validCounts)),
    drawCount: draws.length,
    drawsBelowExpected: totalCounts.filter((count) => count < expectedRowsPerDraw).length,
    expectedRowsPerDraw,
    invalidLengthRows: sum(totalCounts) - sum(validCounts),
    maxRowsPerDraw: Math.max(0, ...totalCounts),
    minRowsPerPresentDraw: getMinPositive(totalCounts),
    sourcePrizeTypes: [...SIX_DIGIT_SOURCE_PRIZE_TYPES],
    totalRows: sum(totalCounts),
    validSixDigitRows: sum(validCounts)
  };
}

function buildWindowSamples(draws: readonly DrawRow[]) {
  const allTimeSamples = ANALYSIS_PRIZE_TYPES.flatMap((prizeType) =>
    WINDOW_PRESETS.map((windowPreset) =>
      buildWindowSample(draws, prizeType, "ALL_TIME", windowPreset)
    )
  );
  const monthSamplePrizeTypes = ["PRIZE3", "PRIZE4", "PRIZE5", "SIX_DIGIT_ALL"] as const;
  const monthSamples = monthSamplePrizeTypes.flatMap((prizeType) =>
    MONTHS.map((month) => buildWindowSample(draws, prizeType, "MONTH", "50", month))
  );

  return [...allTimeSamples, ...monthSamples];
}

function buildWindowSample(
  draws: readonly DrawRow[],
  prizeType: AnalysisPrizeType,
  scope: "ALL_TIME" | "MONTH",
  windowPreset: WindowPreset,
  month?: number
) {
  const sampleDraws = selectSampleDraws(draws, prizeType, scope, windowPreset, month);
  const expectedRowsPerDraw = getExpectedRowsPerDrawForAnalysisPrize(prizeType);
  const validPrizeCounts = sampleDraws.map(
    (draw) => filterValidAnalysisPrizes(draw.prizes, prizeType).length
  );
  const rawPrizeCounts = sampleDraws.map(
    (draw) => filterPrizesForAnalysis(draw.prizes, prizeType).length
  );

  return {
    averageValidRowsPerDraw: round(average(validPrizeCounts)),
    expectedRowsPerDraw,
    invalidLengthRows: sum(rawPrizeCounts) - sum(validPrizeCounts),
    month: month ?? null,
    prizeType,
    sampleDrawCount: sampleDraws.length,
    samplePrizeCount: sum(validPrizeCounts),
    scope,
    windowPreset,
    windowSize: windowPreset === "ALL" ? null : Number(windowPreset)
  };
}

function buildHeatmapMatrixDiagnostics(draws: readonly DrawRow[]) {
  return CALENDAR_DIAGNOSTIC_PRIZE_TYPES.flatMap((prizeType) =>
    WINDOW_PRESETS.flatMap((windowPreset) =>
      MATRIX_DIAGNOSTIC_SCOPES.flatMap((scope) => {
        if (scope === "MONTH") {
          return MATRIX_DIAGNOSTIC_MONTHS.map((month) =>
            buildHeatmapDiagnosticCell(draws, prizeType, scope, windowPreset, month)
          );
        }

        return [buildHeatmapDiagnosticCell(draws, prizeType, scope, windowPreset)];
      })
    )
  );
}

function buildHeatmapDiagnosticCell(
  draws: readonly DrawRow[],
  prizeType: AnalysisPrizeType,
  scope: "ALL_TIME" | "MONTH",
  windowPreset: WindowPreset,
  month?: number
) {
  const sampleDraws = selectSampleDraws(draws, prizeType, scope, windowPreset, month);
  const numberLength = getAnalysisPrizeNumberLength(prizeType);
  const heatmapRows = buildHeatmapRows(sampleDraws, prizeType, numberLength);

  return {
    eventCountMismatchCount: heatmapRows.filter((row) => !row.eventCountMatchesSample).length,
    flatBaselineHotScoreCount: heatmapRows.filter(
      (row) => Math.abs(row.maxEventRatePercent - 10) <= 0.5 && row.maxScore > 80
    ).length,
    heatmapRowCount: heatmapRows.length,
    month: month ?? null,
    prizeType,
    sampleDrawCount: sampleDraws.length,
    scope,
    windowPreset
  };
}

function buildHeatmapMatrixWarnings(diagnostics: ReturnType<typeof buildHeatmapMatrixDiagnostics>) {
  const warnings: string[] = [];

  for (const diagnostic of diagnostics) {
    if (diagnostic.eventCountMismatchCount > 0) {
      warnings.push(
        `heatmap matrix ${diagnostic.prizeType} ${diagnostic.scope} month=${diagnostic.month ?? "ALL"} window=${diagnostic.windowPreset}: ${diagnostic.eventCountMismatchCount} position rows with eventCount mismatch.`
      );
    }
  }

  return warnings;
}

function buildNumberStatsMatrixDiagnostics(draws: readonly DrawRow[]) {
  const prizeTypes = ["TWO_DIGIT", "THREE_DIGIT", "PRIZE5", "SIX_DIGIT_ALL"] as const;

  return prizeTypes.flatMap((prizeType) =>
    WINDOW_PRESETS.flatMap((windowPreset) =>
      MATRIX_DIAGNOSTIC_SCOPES.flatMap((scope) => {
        if (scope === "MONTH") {
          return MATRIX_DIAGNOSTIC_MONTHS.map((month) =>
            buildNumberStatsMatrixCell(draws, prizeType, scope, windowPreset, month)
          );
        }

        return [buildNumberStatsMatrixCell(draws, prizeType, scope, windowPreset)];
      })
    )
  );
}

function buildNumberStatsMatrixCell(
  draws: readonly DrawRow[],
  prizeType: (typeof ANALYSIS_PRIZE_TYPES)[number],
  scope: "ALL_TIME" | "MONTH",
  windowPreset: WindowPreset,
  month?: number
) {
  const sampleDraws = selectSampleDraws(draws, prizeType, scope, windowPreset, month);
  const samplePrizes = sampleDraws.flatMap((draw) =>
    filterValidAnalysisPrizes(draw.prizes, prizeType)
  );
  const sampleDrawCount = sampleDraws.length;
  const samplePrizeCount = samplePrizes.length;
  const maxInflationFactor = getMaxDrawDenominatorInflation(sampleDrawCount, samplePrizes);

  return {
    maxDrawDenominatorInflationFactor: maxInflationFactor,
    month: month ?? null,
    prizeType,
    sampleDrawCount,
    samplePrizeCount,
    scope,
    windowPreset
  };
}

function getMaxDrawDenominatorInflation(
  sampleDrawCount: number,
  samplePrizes: readonly PrizeRow[]
) {
  const hitCountByNumber = new Map<string, number>();

  for (const prize of samplePrizes) {
    hitCountByNumber.set(prize.number, (hitCountByNumber.get(prize.number) ?? 0) + 1);
  }

  return Math.max(
    0,
    ...[...hitCountByNumber.values()].map((hitCount) => {
      const rowBased = getPercent(hitCount, samplePrizes.length);
      const drawBased = getPercent(hitCount, sampleDrawCount);

      return rowBased > 0 ? round(drawBased / rowBased) : 0;
    })
  );
}

function buildThreeDigitPrizeDecision(prizeProfiles: ReturnType<typeof buildPrizeProfiles>) {
  const threeDigit = prizeProfiles.find((profile) => profile.prizeType === "THREE_DIGIT");
  const threeFront = prizeProfiles.find((profile) => profile.prizeType === "THREE_FRONT");
  const threeBack = prizeProfiles.find((profile) => profile.prizeType === "THREE_BACK");

  const frontHasRows = (threeFront?.drawCountWithPrize ?? 0) > 0;
  const backHasRows = (threeBack?.drawCountWithPrize ?? 0) > 0;
  const groupedHasRows = (threeDigit?.drawCountWithPrize ?? 0) > 0;

  let recommendation: "native_rows" | "derive_from_three_digit" | "hide_until_seeded";

  if (frontHasRows && backHasRows) {
    recommendation = "native_rows";
  } else if (groupedHasRows) {
    recommendation = "derive_from_three_digit";
  } else {
    recommendation = "hide_until_seeded";
  }

  return {
    profiles: {
      THREE_BACK: threeBack,
      THREE_DIGIT: threeDigit,
      THREE_FRONT: threeFront
    },
    recommendation
  };
}

function buildModuleAudit() {
  return [
    {
      crossPrizeRawCompare: true,
      metricUnit: "prize-row frequencyPercent",
      module: "watchlist",
      onDemandFallback: true,
      primaryDenominator: "samplePrizeCount",
      rawHitCountRanking: true,
      risk: "high",
      surfaces: ["watchlist enrichment"]
    },
    {
      crossPrizeRawCompare: true,
      metricUnit: "mixed prize-row stats",
      module: "search",
      onDemandFallback: true,
      primaryDenominator: "samplePrizeCount per prizeType",
      rawHitCountRanking: false,
      risk: "high",
      surfaces: ["6-digit stat search"]
    },
    {
      crossPrizeRawCompare: false,
      metricUnit: "prize-row + digit-event",
      module: "analytics",
      onDemandFallback: true,
      primaryDenominator: "samplePrizeCount / sampleEventCount",
      rawHitCountRanking: true,
      risk: "medium",
      surfaces: ["analytics UI signal cards"]
    },
    {
      crossPrizeRawCompare: false,
      metricUnit: "digit-event heatmap",
      module: "calendar",
      onDemandFallback: true,
      primaryDenominator: "sampleEventCount",
      rawHitCountRanking: false,
      risk: "medium",
      surfaces: ["calendar heatmap"]
    },
    {
      crossPrizeRawCompare: false,
      metricUnit: "pattern row distribution",
      module: "patterns",
      onDemandFallback: false,
      primaryDenominator: "totalHits (prize rows)",
      rawHitCountRanking: false,
      risk: "medium",
      surfaces: ["patterns snapshot-only"]
    },
    {
      crossPrizeRawCompare: false,
      metricUnit: "prediction score",
      module: "prediction-lab",
      onDemandFallback: true,
      primaryDenominator: "mixed",
      rawHitCountRanking: false,
      risk: "medium",
      surfaces: ["prediction scoring"]
    },
    {
      crossPrizeRawCompare: false,
      metricUnit: "prediction score",
      module: "compare",
      onDemandFallback: true,
      primaryDenominator: "samplePrizeCount",
      rawHitCountRanking: false,
      risk: "low",
      surfaces: ["compare ranking"]
    },
    {
      crossPrizeRawCompare: false,
      metricUnit: "walk-forward hit rate",
      module: "backtest",
      onDemandFallback: false,
      primaryDenominator: "universeSize",
      rawHitCountRanking: false,
      risk: "low",
      surfaces: ["backtest"]
    },
    {
      crossPrizeRawCompare: false,
      metricUnit: "prize-row frequencyPercent",
      module: "dashboard",
      onDemandFallback: true,
      primaryDenominator: "samplePrizeCount",
      rawHitCountRanking: false,
      risk: "low",
      surfaces: ["dashboard metrics"]
    }
  ];
}

function buildCalendarHeatmapDiagnostics(draws: readonly DrawRow[]) {
  return CALENDAR_DIAGNOSTIC_PRIZE_TYPES.map((prizeType) => {
    const sampleDraws = selectSampleDraws(draws, prizeType, "ALL_TIME", "50");
    const numberLength = getAnalysisPrizeNumberLength(prizeType);
    const rowsPerDraw = sampleDraws.map(
      (draw) => filterValidAnalysisPrizes(draw.prizes, prizeType).length
    );
    const heatmapRows = buildHeatmapRows(sampleDraws, prizeType, numberLength);
    const averageRowsPerDraw = average(rowsPerDraw);
    const expectedPresenceRate = 1 - 0.9 ** averageRowsPerDraw;

    return {
      averageRowsPerDraw: round(averageRowsPerDraw),
      expectedDigitPresenceRatePerDraw: round(expectedPresenceRate * 100),
      heatmapRows,
      maxRowsPerDraw: Math.max(0, ...rowsPerDraw),
      minRowsPerDraw: rowsPerDraw.length > 0 ? Math.min(...rowsPerDraw) : 0,
      prizeType,
      sampleDrawCount: sampleDraws.length,
      windowPreset: "50"
    };
  });
}

function buildCalendarHeatmapWarnings(
  diagnostics: ReturnType<typeof buildCalendarHeatmapDiagnostics>
) {
  const warnings: string[] = [];

  for (const diagnostic of diagnostics) {
    for (const row of diagnostic.heatmapRows) {
      if (!row.eventCountMatchesSample) {
        warnings.push(
          `${diagnostic.prizeType} P${row.position}: eventCountSum ${row.eventCountSum} does not match sampleEventCount ${row.sampleEventCount}.`
        );
      }
    }
  }

  return warnings;
}

function buildNumberStatsDiagnostics(draws: readonly DrawRow[]) {
  return CALENDAR_DIAGNOSTIC_PRIZE_TYPES.map((prizeType) => {
    const sampleDraws = selectSampleDraws(draws, prizeType, "ALL_TIME", "50");
    const samplePrizes = sampleDraws.flatMap((draw) =>
      filterValidAnalysisPrizes(draw.prizes, prizeType)
    );
    const hitCountByNumber = new Map<string, number>();

    for (const prize of samplePrizes) {
      hitCountByNumber.set(prize.number, (hitCountByNumber.get(prize.number) ?? 0) + 1);
    }

    const sampleDrawCount = sampleDraws.length;
    const samplePrizeCount = samplePrizes.length;
    const rows = [...hitCountByNumber.entries()]
      .map(([number, hitCount]) => {
        const drawBasedFrequencyPercent = getPercent(hitCount, sampleDrawCount);
        const rowBasedFrequencyPercent = getPercent(hitCount, samplePrizeCount);

        return {
          drawBasedFrequencyPercent,
          hitCount,
          inflationFactor:
            rowBasedFrequencyPercent > 0
              ? round(drawBasedFrequencyPercent / rowBasedFrequencyPercent)
              : 0,
          number,
          rowBasedFrequencyPercent
        };
      })
      .sort(
        (left, right) =>
          right.drawBasedFrequencyPercent - left.drawBasedFrequencyPercent ||
          right.hitCount - left.hitCount ||
          left.number.localeCompare(right.number)
      )
      .slice(0, 20);

    return {
      prizeType,
      sampleDrawCount,
      samplePrizeCount,
      topDrawDenominatorInflationExamples: rows,
      windowPreset: "50"
    };
  });
}

function buildSnapshotCoverage(snapshots: readonly SnapshotRow[]) {
  const currentEngineSnapshots = snapshots.filter(
    (snapshot) => snapshot.engineVersion === ANALYSIS_ENGINE_VERSION
  );
  const snapshotByContextKey = new Map(
    currentEngineSnapshots.map((snapshot) => [snapshot.contextKey, snapshot])
  );
  const expectedContextKeys = buildExpectedSnapshotContextKeys();
  const missingContextKeys = expectedContextKeys.filter(
    (contextKey) => !snapshotByContextKey.has(contextKey)
  );
  const computedTimes = currentEngineSnapshots.map((snapshot) => snapshot.computedAt.getTime());

  return {
    computedAtRange:
      computedTimes.length > 0
        ? {
            end: new Date(Math.max(...computedTimes)).toISOString(),
            start: new Date(Math.min(...computedTimes)).toISOString()
          }
        : null,
    currentEngineVersion: ANALYSIS_ENGINE_VERSION,
    existingCount: currentEngineSnapshots.length,
    expectedCount: expectedContextKeys.length,
    invalidPrizeRowsInSnapshots: currentEngineSnapshots.reduce(
      (total, snapshot) => total + snapshot.invalidPrizeCount,
      0
    ),
    legacyEngineCount: snapshots.length - currentEngineSnapshots.length,
    missingCount: missingContextKeys.length,
    missingExamples: missingContextKeys.slice(0, 50),
    sampleRows: currentEngineSnapshots.slice(0, 50).map((snapshot) => ({
      contextKey: snapshot.contextKey,
      computedAt: snapshot.computedAt.toISOString(),
      invalidPrizeCount: snapshot.invalidPrizeCount,
      sampleDrawCount: snapshot.sampleDrawCount,
      samplePrizeCount: snapshot.samplePrizeCount
    }))
  };
}

function buildExpectedSnapshotContextKeys() {
  return ANALYSIS_PRIZE_TYPES.flatMap((prizeType) =>
    WINDOW_PRESETS.flatMap((windowPreset) => [
      getContextKey({ month: undefined, prizeType, scope: "ALL_TIME", windowPreset }),
      ...MONTHS.map((month) => getContextKey({ month, prizeType, scope: "MONTH", windowPreset }))
    ])
  );
}

function getContextKey({
  month,
  prizeType,
  scope,
  windowPreset
}: {
  month?: number;
  prizeType: AnalysisPrizeType;
  scope: "ALL_TIME" | "MONTH";
  windowPreset: WindowPreset;
}) {
  return [
    ANALYSIS_ENGINE_VERSION,
    LOTTERY_TYPE,
    prizeType,
    getAnalysisPrizeNumberLength(prizeType),
    scope,
    month ?? "ALL_MONTHS",
    windowPreset
  ].join("|");
}

function selectSampleDraws(
  draws: readonly DrawRow[],
  prizeType: AnalysisPrizeType,
  scope: "ALL_TIME" | "MONTH",
  windowPreset: WindowPreset,
  month?: number
) {
  const limit = windowPreset === "ALL" ? undefined : Number(windowPreset);
  const matchingDraws = draws.filter((draw) => {
    if (scope === "MONTH" && draw.drawDate.getUTCMonth() + 1 !== month) {
      return false;
    }

    return filterPrizesForAnalysis(draw.prizes, prizeType).length > 0;
  });
  const newestFirst = [...matchingDraws].sort(
    (left, right) => right.drawDate.getTime() - left.drawDate.getTime()
  );

  return (limit ? newestFirst.slice(0, limit) : newestFirst).reverse();
}

function buildHeatmapRows(
  draws: readonly DrawRow[],
  prizeType: AnalysisPrizeType,
  numberLength: number
) {
  return buildPositionHeatmapRows(
    draws.map((draw) => ({
      drawDate: draw.drawDate,
      numbers: filterValidAnalysisPrizes(draw.prizes, prizeType).map((prize) => prize.number)
    })),
    numberLength
  ).map((row) => {
    const scores = row.cells.map((cell) => cell.score);
    const appearanceRates = row.cells.map((cell) => getRate(cell.appearanceCount, draws.length));
    const eventCountSum = sum(row.cells.map((cell) => cell.eventCount));
    const eventRates = row.cells.map((cell) => cell.eventRatePercent);
    const lifts = row.cells.map((cell) => cell.lift);
    const sampleEventCount = row.cells[0]?.sampleEventCount ?? 0;

    return {
      averageAppearanceRate: round(average(appearanceRates) * 100),
      averageEventRatePercent: round(average(eventRates)),
      averageLift: round(average(lifts)),
      averageScore: round(average(scores)),
      eventCountMatchesSample: eventCountSum === sampleEventCount,
      eventCountSum,
      hotCellCount: row.cells.filter((cell) => cell.score >= 80).length,
      maxAppearanceCount: Math.max(0, ...row.cells.map((cell) => cell.appearanceCount)),
      maxEventRatePercent: Math.max(0, ...eventRates),
      maxScore: Math.max(0, ...scores),
      minEventRatePercent: Math.min(...eventRates),
      minScore: Math.min(...scores),
      position: row.position,
      sampleEventCount,
      warmOrHotCellCount: row.cells.filter((cell) => cell.score >= 65).length
    };
  });
}

function filterValidAnalysisPrizes(prizes: readonly PrizeRow[], prizeType: AnalysisPrizeType) {
  const numberLength = getAnalysisPrizeNumberLength(prizeType);

  return filterPrizesForAnalysis(prizes, prizeType).filter(
    (prize) => prize.number.length === numberLength
  );
}

function filterPrizesForAnalysis(prizes: readonly PrizeRow[], prizeType: AnalysisPrizeType) {
  return prizes.filter((prize) =>
    matchesAnalysisPrizeSample(
      { position: prize.position, type: toPrizeType(prize.type) },
      { prizeType }
    )
  );
}

function countPrizes(prizes: readonly PrizeRow[], prizeTypes: readonly PrizeType[]) {
  return prizes.filter((prize) => prizeTypes.includes(toPrizeType(prize.type))).length;
}

function getAnalysisPrizeSourceTypes(prizeType: AnalysisPrizeType): readonly PrizeType[] {
  return getPrizeTypesForSampleQuery(prizeType) as readonly PrizeType[];
}

function getExpectedRowsPerDrawForAnalysisPrize(prizeType: AnalysisPrizeType) {
  return getAnalysisPrizeSourceTypes(prizeType).reduce<number | null>((total, sourceType) => {
    const expected = EXPECTED_ROWS_PER_DRAW[sourceType];

    if (expected === null || total === null) {
      return null;
    }

    return total + expected;
  }, 0);
}

function getExpectedNumberLength(prizeType: PrizeType) {
  if (prizeType === "TWO_DIGIT") {
    return 2;
  }

  if (prizeType === "THREE_DIGIT" || prizeType === "THREE_FRONT" || prizeType === "THREE_BACK") {
    return 3;
  }

  if (prizeType === "OTHER") {
    return null;
  }

  return 6;
}

function getAnalysisPrizeNumberLength(prizeType: AnalysisPrizeType) {
  if (prizeType === "TWO_DIGIT") {
    return 2;
  }

  if (prizeType === "THREE_DIGIT" || prizeType === "THREE_FRONT" || prizeType === "THREE_BACK") {
    return 3;
  }

  return 6;
}

function getDateRange(draws: readonly DrawRow[]) {
  const first = draws[0];
  const last = draws.at(-1);

  return {
    end: last ? formatDate(last.drawDate) : null,
    start: first ? formatDate(first.drawDate) : null
  };
}

function toPrizeType(value: string): PrizeType {
  return PRIZE_TYPES.includes(value as PrizeType) ? (value as PrizeType) : "OTHER";
}

function getPercent(value: number, total: number) {
  return total > 0 ? round((value / total) * 100) : 0;
}

function getRate(value: number, total: number) {
  return total > 0 ? value / total : 0;
}

function average(values: readonly number[]) {
  return values.length > 0 ? sum(values) / values.length : 0;
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function getMinPositive(values: readonly number[]) {
  const positiveValues = values.filter((value) => value > 0);

  return positiveValues.length > 0 ? Math.min(...positiveValues) : 0;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
