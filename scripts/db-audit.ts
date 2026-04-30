import { getPrisma } from "@/api/service/prisma";

type SourceStatus = "IMPORTED" | "PARTIAL" | "VERIFIED";

async function main() {
  const prisma = getPrisma();

  try {
    const [
      drawCount,
      prizeCount,
      predictionRunCount,
      backtestRunCount,
      latestDraw,
      sourceStatusRows,
      digitSnapshotCount,
      numberSnapshotCount,
      latestDigitSnapshot,
      latestNumberSnapshot
    ] = await Promise.all([
      prisma.lotteryDraw.count(),
      prisma.lotteryPrize.count(),
      prisma.predictionRun.count(),
      prisma.backtestRun.count(),
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
      prisma.digitStatSnapshot.count(),
      prisma.numberStatSnapshot.count(),
      prisma.digitStatSnapshot.findFirst({
        orderBy: { computedAt: "desc" },
        select: { computedAt: true }
      }),
      prisma.numberStatSnapshot.findFirst({
        orderBy: { computedAt: "desc" },
        select: { computedAt: true }
      })
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
      `Backtest runs: ${backtestRunCount}`,
      `Digit stat snapshots: ${digitSnapshotCount}${formatComputedAtSuffix(latestDigitSnapshot?.computedAt)}`,
      `Number stat snapshots: ${numberSnapshotCount}${formatComputedAtSuffix(latestNumberSnapshot?.computedAt)}`
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

function formatComputedAtSuffix(value?: Date | null) {
  if (!value) {
    return "";
  }

  return ` | latest computedAt=${value.toISOString()}`;
}
