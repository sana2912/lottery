import {
  ANALYSIS_MONTHS,
  ANALYSIS_PRIZE_TYPES,
  ANALYSIS_SCOPES,
  type AnalysisMonth,
  type AnalysisPrizeType,
  type AnalysisScope,
  isAnalysisPrizeType,
  isAnalysisScope
} from "@/api/service/analysis-snapshot/analysis-context";
import { recomputeAnalysisSnapshot } from "@/api/service/analysis-snapshot/compute-analysis-snapshot";
import {
  getExpectedAnalysisContextCount,
  listAllTimeAnalysisContexts,
  listAnalysisContexts
} from "@/api/service/analysis-snapshot/context-plan";
import { resolveComputeYears } from "./lib/compute-analysis-plan";

type ComputeAnalysisOptions = {
  month?: AnalysisMonth;
  prizeType?: AnalysisPrizeType;
  scope?: AnalysisScope;
  year?: number;
  years?: number[];
};

async function main() {
  const options = await parseArgs(process.argv.slice(2));
  const contexts = buildComputePlan(options);

  assertFullComputePlan(contexts, options);

  const expected =
    options.years !== undefined ? getExpectedAnalysisContextCount(options.years) : undefined;

  console.info(
    [
      `Compute analysis: recomputing ${contexts.length} context${contexts.length === 1 ? "" : "s"}.`,
      expected !== undefined ? `Expected for this year set: ${expected}.` : ""
    ]
      .filter(Boolean)
      .join(" ")
  );

  for (const [index, context] of contexts.entries()) {
    const label = [
      `[${index + 1}/${contexts.length}]`,
      `prizeType=${context.prizeType}`,
      `scope=${context.scope}`,
      `month=${context.month ?? "ALL"}`,
      `year=${context.year ?? "ALL"}`,
      `window=${context.windowPreset}`
    ].join(" ");
    const startedAt = Date.now();

    console.info(`${label} starting...`);
    const summary = await recomputeAnalysisSnapshot(context);
    const durationMs = Date.now() - startedAt;

    console.info(
      [
        `${label} done in ${Math.round(durationMs / 1000)}s.`,
        `Draws: ${summary.sampleDrawCount}.`,
        `Prizes: ${summary.samplePrizeCount}.`,
        `Invalid length skipped: ${summary.invalidPrizeCount}.`,
        `Computed at: ${summary.computedAt}.`
      ].join(" ")
    );
  }
}

if (import.meta.main) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(`Compute analysis failed: ${message}`);
    process.exitCode = 1;
  });
}

async function parseArgs(args: readonly string[]): Promise<ComputeAnalysisOptions> {
  const values = Object.fromEntries(
    args.map((argument) => {
      const [key, value] = argument.replace(/^--/, "").split("=", 2);

      return [key, value];
    })
  );
  const prizeType = values.prizeType;
  const scope = values.scope;
  const month = values.month ? Number(values.month) : undefined;
  const year = values.year ? Number(values.year) : undefined;
  const years = values.years
    ? values.years.split(",").map((value) => Number(value.trim()))
    : undefined;
  let parsedPrizeType: AnalysisPrizeType | undefined;
  let parsedScope: AnalysisScope | undefined;

  if (prizeType) {
    if (!isAnalysisPrizeType(prizeType)) {
      throw new Error(`Invalid --prizeType. Supported values: ${ANALYSIS_PRIZE_TYPES.join(", ")}`);
    }

    parsedPrizeType = prizeType;
  }

  if (scope) {
    if (!isAnalysisScope(scope)) {
      throw new Error(`Invalid --scope. Supported values: ${ANALYSIS_SCOPES.join(", ")}`);
    }

    parsedScope = scope;
  }

  if (month !== undefined && !ANALYSIS_MONTHS.includes(month as AnalysisMonth)) {
    throw new Error("Invalid --month. Supported values: 1..12");
  }

  const resolvedYears = await resolveComputeYears({
    scope: parsedScope,
    year,
    years
  });

  return {
    month: month as AnalysisMonth | undefined,
    prizeType: parsedPrizeType,
    scope: parsedScope,
    year,
    years: resolvedYears
  };
}

function buildComputePlan(options: ComputeAnalysisOptions) {
  return listAnalysisContexts({
    month: options.month,
    prizeType: options.prizeType,
    scope: options.scope,
    year: options.year,
    years: options.years
  });
}

function assertFullComputePlan(
  contexts: ReturnType<typeof buildComputePlan>,
  options: ComputeAnalysisOptions
) {
  const isFilteredRun =
    options.scope !== undefined ||
    options.prizeType !== undefined ||
    options.month !== undefined ||
    options.year !== undefined ||
    options.years !== undefined;

  if (!isFilteredRun && contexts.length <= listAllTimeAnalysisContexts().length) {
    throw new Error(
      [
        `Full db:compute-analysis resolved only ${contexts.length} contexts (ALL_TIME only).`,
        "MONTH×year matrix was skipped because draw years were not attached to the plan.",
        "Re-run after fixing resolveComputeYears, or pass --years=... explicitly."
      ].join(" ")
    );
  }
}
