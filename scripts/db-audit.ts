import { getPrisma } from "@/api/service/prisma";

type SourceStatus = "IMPORTED" | "PARTIAL" | "VERIFIED";

async function main() {
  const prisma = getPrisma();

  try {
    const [
      drawCount,
      prizeCount,
      predictionRunCount,
      latestDraw,
      sourceStatusRows,
      analysisRunCount,
      analysisDigitStatCount,
      analysisNumberStatCount,
      analysisPatternSummaryCount,
      analysisCalendarHeatmapCount,
      latestAnalysisSnapshot
    ] = await Promise.all([
      prisma.lotteryDraw.count(),
      prisma.lotteryPrize.count(),
      prisma.predictionRun.count(),
      prisma.lotteryDraw.findFirst({
        orderBy: { drawDate: "desc" },
        select: {
          drawDate: true,
          drawNo: true,
          lotteryType: true,
          sourceStatus: true
        }
      }),
      prisma.lotteryDraw.groupBy({
        by: ["sourceStatus"],
        _count: {
          _all: true
        }
      }),
      getAnalysisSnapshotRunCount(prisma),
      getAnalysisDigitStatCount(prisma),
      getAnalysisNumberStatCount(prisma),
      getAnalysisPatternSummaryCount(prisma),
      getAnalysisCalendarHeatmapCount(prisma),
      getLatestAnalysisComputedAt(prisma)
    ]);

    const sourceStatusSummary = formatSourceStatusSummary(sourceStatusRows);
    const latestDrawSummary = latestDraw
      ? [
          formatDate(latestDraw.drawDate),
          latestDraw.drawNo ? `drawNo=${latestDraw.drawNo}` : "",
          `lotteryType=${latestDraw.lotteryType}`,
          `sourceStatus=${latestDraw.sourceStatus}`
        ]
          .filter(Boolean)
          .join(" | ")
      : "none";

    const auditLines = [
      "Lottery database audit",
      `Draw rows: ${drawCount}`,
      `Prize rows: ${prizeCount}`,
      `Latest draw: ${latestDrawSummary}`,
      `Source status counts: ${sourceStatusSummary}`,
      `Prediction runs: ${predictionRunCount}`,
      `Analysis snapshot runs: ${analysisRunCount}${formatComputedAtSuffix(latestAnalysisSnapshot?.computedAt)}`,
      `Analysis digit stats: ${analysisDigitStatCount}`,
      `Analysis number stats: ${analysisNumberStatCount}`,
      `Analysis pattern summaries: ${analysisPatternSummaryCount}`,
      `Analysis calendar heatmaps: ${analysisCalendarHeatmapCount}`
    ];

    console.info(auditLines.join("\n"));
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Database audit failed: ${message}`);
  process.exitCode = 1;
});

function formatSourceStatusSummary(
  rows: Array<{
    _count: { _all: number };
    sourceStatus: SourceStatus;
  }>
) {
  const counts = new Map(rows.map((row) => [row.sourceStatus, row._count._all] as const));
  const sourceStatuses: SourceStatus[] = ["IMPORTED", "PARTIAL", "VERIFIED"];

  return sourceStatuses.map((status) => `${status}=${counts.get(status) ?? 0}`).join(" | ");
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function getAnalysisSnapshotRunCount(prisma: ReturnType<typeof getPrisma>) {
  const [row] = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM "analysis_snapshot_runs"
  `;

  return row?.count ?? 0;
}

async function getAnalysisDigitStatCount(prisma: ReturnType<typeof getPrisma>) {
  const [row] = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM "analysis_digit_stats"
  `;

  return row?.count ?? 0;
}

async function getAnalysisNumberStatCount(prisma: ReturnType<typeof getPrisma>) {
  const [row] = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM "analysis_number_stats"
  `;

  return row?.count ?? 0;
}

async function getAnalysisPatternSummaryCount(prisma: ReturnType<typeof getPrisma>) {
  const [row] = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM "analysis_pattern_summaries"
  `;

  return row?.count ?? 0;
}

async function getAnalysisCalendarHeatmapCount(prisma: ReturnType<typeof getPrisma>) {
  const [row] = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM "analysis_calendar_heatmaps"
  `;

  return row?.count ?? 0;
}

async function getLatestAnalysisComputedAt(prisma: ReturnType<typeof getPrisma>) {
  const [row] = await prisma.$queryRaw<Array<{ computedAt: Date }>>`
    SELECT "computedAt" FROM "analysis_snapshot_runs" ORDER BY "computedAt" DESC LIMIT 1
  `;

  return row;
}

function formatComputedAtSuffix(value?: Date | null) {
  if (!value) {
    return "";
  }

  return ` | latest computedAt=${value.toISOString()}`;
}
