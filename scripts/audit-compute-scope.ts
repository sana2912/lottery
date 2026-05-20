import { getAnalysisContextKey } from "@/api/service/analysis-snapshot/analysis-context";
import {
  discoverAnalysisDrawYears,
  listAnalysisContexts
} from "@/api/service/analysis-snapshot/context-plan";
import { resolveAnalysisSample } from "@/api/service/analysis-snapshot/sample-resolver";
import { getPrisma } from "@/api/service/prisma";
import { parseCliValues, printOrWriteJsonReport, writeTextReport } from "./audit-utils";
import {
  buildComputeScopeAuditReport,
  buildComputeScopeMarkdown,
  type ScopeAuditSnapshot
} from "./lib/compute-scope-audit";

const LOTTERY_TYPE = "THAI_GOVERNMENT";
const DEFAULT_OUT = "reports/audit/compute-scope.json";
const DEFAULT_REPORT_OUT = "reports/audit/compute-scope.md";

type CliOptions = {
  out: string;
  report: boolean;
  reportOut: string;
  spotCheckDb: boolean;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const prisma = getPrisma();

  try {
    const [draws, snapshots] = await Promise.all([
      prisma.lotteryDraw.findMany({
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
        orderBy: { drawDate: "asc" },
        where: {
          drawDate: { lte: new Date() },
          lotteryType: LOTTERY_TYPE
        }
      }),
      loadSnapshots(prisma)
    ]);

    let dbSpotChecks = options.spotCheckDb ? await runBaselineDbSpotChecks() : undefined;
    const years = await discoverAnalysisDrawYears();
    let report = buildComputeScopeAuditReport({
      dbSpotChecks,
      draws: draws.map((draw) => ({
        drawDate: draw.drawDate,
        drawNo: draw.drawNo,
        prizes: draw.prizes.map((prize) => ({
          number: prize.number,
          position: prize.position,
          type: prize.type
        }))
      })),
      snapshots,
      years
    });

    if (options.spotCheckDb) {
      const failureContexts = listFailureContexts(report.contextRows);

      if (failureContexts.length > 0) {
        dbSpotChecks = await mergeDbSpotChecks(dbSpotChecks, failureContexts);
        report = buildComputeScopeAuditReport({
          dbSpotChecks,
          years,
          draws: draws.map((draw) => ({
            drawDate: draw.drawDate,
            drawNo: draw.drawNo,
            prizes: draw.prizes.map((prize) => ({
              number: prize.number,
              position: prize.position,
              type: prize.type
            }))
          })),
          snapshots
        });
      }
    }

    await printOrWriteJsonReport({ out: options.out, value: report });

    if (options.report) {
      const path = await writeTextReport(options.reportOut, buildComputeScopeMarkdown(report));

      console.info(`Scope audit markdown written to ${path}`);
    }

    const failures = report.contextRows.filter(
      (row) => row.status !== "ok" && row.status !== "zero_eligible"
    );

    console.info(
      [
        `Compute scope audit: ${report.summary.totalContexts} contexts.`,
        `OK=${report.summary.byStatus.ok ?? 0},`,
        `zero_eligible=${report.summary.zeroEligibleCount},`,
        `failures=${failures.length}.`
      ].join(" ")
    );

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

function parseArgs(args: readonly string[]): CliOptions {
  const values = parseCliValues(args);

  return {
    out: values.out ?? DEFAULT_OUT,
    report: values.report === "true",
    reportOut: values["report-out"] ?? DEFAULT_REPORT_OUT,
    spotCheckDb: values["spot-check-db"] !== "false"
  };
}

async function loadSnapshots(prisma: ReturnType<typeof getPrisma>): Promise<ScopeAuditSnapshot[]> {
  return prisma.$queryRaw<ScopeAuditSnapshot[]>`
    SELECT
      "contextKey",
      "prizeType",
      "scope",
      "month",
      "windowPreset",
      "windowSize",
      "sampleDrawCount",
      "samplePrizeCount",
      "invalidPrizeCount",
      "engineVersion",
      "startDrawDate",
      "endDrawDate",
      "computedAt"
    FROM "analysis_snapshot_runs"
    ORDER BY "prizeType" ASC, "scope" ASC, "month" ASC NULLS FIRST, "windowPreset" ASC
  `;
}

function listFailureContexts(rows: ReturnType<typeof buildComputeScopeAuditReport>["contextRows"]) {
  const contexts = listAnalysisContexts();

  return contexts.filter((context) => {
    const key = getAnalysisContextKey(context);
    const row = rows.find((item) => item.contextKey === key);

    return row && row.status !== "ok" && row.status !== "zero_eligible";
  });
}

async function mergeDbSpotChecks(
  existing: Map<string, { drawCount: number; prizeCount: number }> | undefined,
  contexts: ReturnType<typeof listAnalysisContexts>
) {
  const merged = new Map(existing);

  for (const context of contexts) {
    const key = getAnalysisContextKey(context);

    if (merged.has(key)) {
      continue;
    }

    const sample = await resolveAnalysisSample(context);

    merged.set(key, {
      drawCount: sample.drawCount,
      prizeCount: sample.prizeCount
    });
  }

  return merged;
}

async function runBaselineDbSpotChecks() {
  const years = await discoverAnalysisDrawYears();
  const latestYear = years.at(-1) ?? new Date().getUTCFullYear();
  const spotContexts = [
    ...listAnalysisContexts({ scope: "ALL_TIME" }).filter(
      (context, index, all) =>
        all.findIndex((item) => item.prizeType === context.prizeType) === index
    ),
    ...listAnalysisContexts({ scope: "MONTH", month: 1, years: [latestYear] }),
    ...listAnalysisContexts({ scope: "MONTH", month: 12, years: [latestYear] })
  ];
  const results = new Map<string, { drawCount: number; prizeCount: number }>();

  console.info(
    `DB spot-check baseline: resolveAnalysisSample for ${spotContexts.length} contexts...`
  );

  for (const context of spotContexts) {
    const sample = await resolveAnalysisSample(context);

    results.set(getAnalysisContextKey(context), {
      drawCount: sample.drawCount,
      prizeCount: sample.prizeCount
    });
  }

  return results;
}
