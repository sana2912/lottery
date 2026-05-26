import { getPrisma } from "@/api/service/prisma";

type CountRow = {
  legacyRows: number;
  totalRows: number;
};

type ChildCountRow = {
  legacyRows: number;
  totalRows: number;
};

async function main() {
  const prisma = getPrisma();

  try {
    const counts = await collectCounts(prisma);
    const deletedRunCount = await prisma.$executeRaw`
      DELETE FROM "analysis_snapshot_runs"
    `;

    console.info("Analysis snapshot cleanup complete.");
    console.info(`Legacy runs found: ${counts.runs.legacyRows}`);
    console.info(`Deleted analysis_snapshot_runs rows: ${deletedRunCount}`);
    console.info(`Cascade target analysis_digit_stats rows: ${counts.digits.totalRows}`);
    console.info(`Cascade target analysis_number_stats rows: ${counts.numbers.totalRows}`);
    console.info(`Cascade target analysis_pattern_summaries rows: ${counts.patterns.totalRows}`);
    console.info(`Cascade target analysis_calendar_heatmaps rows: ${counts.heatmaps.totalRows}`);
    console.info(
      `Legacy derived rows found: digits=${counts.digits.legacyRows}, numbers=${counts.numbers.legacyRows}, patterns=${counts.patterns.legacyRows}, heatmaps=${counts.heatmaps.legacyRows}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

async function collectCounts(prisma: ReturnType<typeof getPrisma>) {
  const [runs, digits, numbers, patterns, heatmaps] = await Promise.all([
    prisma.$queryRaw<CountRow[]>`
      SELECT
        COUNT(*)::int AS "totalRows",
        COUNT(*) FILTER (WHERE "contextKey" LIKE '%|ALL')::int AS "legacyRows"
      FROM "analysis_snapshot_runs"
    `,
    prisma.$queryRaw<ChildCountRow[]>`
      SELECT
        COUNT(*)::int AS "totalRows",
        COUNT(*) FILTER (WHERE run."contextKey" LIKE '%|ALL')::int AS "legacyRows"
      FROM "analysis_digit_stats" AS child
      INNER JOIN "analysis_snapshot_runs" AS run
        ON run."_id" = child."runId"
    `,
    prisma.$queryRaw<ChildCountRow[]>`
      SELECT
        COUNT(*)::int AS "totalRows",
        COUNT(*) FILTER (WHERE run."contextKey" LIKE '%|ALL')::int AS "legacyRows"
      FROM "analysis_number_stats" AS child
      INNER JOIN "analysis_snapshot_runs" AS run
        ON run."_id" = child."runId"
    `,
    prisma.$queryRaw<ChildCountRow[]>`
      SELECT
        COUNT(*)::int AS "totalRows",
        COUNT(*) FILTER (WHERE run."contextKey" LIKE '%|ALL')::int AS "legacyRows"
      FROM "analysis_pattern_summaries" AS child
      INNER JOIN "analysis_snapshot_runs" AS run
        ON run."_id" = child."runId"
    `,
    prisma.$queryRaw<ChildCountRow[]>`
      SELECT
        COUNT(*)::int AS "totalRows",
        COUNT(*) FILTER (WHERE run."contextKey" LIKE '%|ALL')::int AS "legacyRows"
      FROM "analysis_calendar_heatmaps" AS child
      INNER JOIN "analysis_snapshot_runs" AS run
        ON run."_id" = child."runId"
    `
  ]);

  return {
    digits: digits[0] ?? { legacyRows: 0, totalRows: 0 },
    heatmaps: heatmaps[0] ?? { legacyRows: 0, totalRows: 0 },
    numbers: numbers[0] ?? { legacyRows: 0, totalRows: 0 },
    patterns: patterns[0] ?? { legacyRows: 0, totalRows: 0 },
    runs: runs[0] ?? { legacyRows: 0, totalRows: 0 }
  };
}
