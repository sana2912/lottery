import {
  ANALYSIS_MONTHS,
  ANALYSIS_PRIZE_TYPES,
  ANALYSIS_SCOPES,
  ANALYSIS_WINDOW_PRESETS,
  type AnalysisMonth,
  type AnalysisPrizeType,
  type AnalysisScope,
  type AnalysisWindowPreset,
  isAnalysisPrizeType,
  isAnalysisScope,
  isAnalysisWindowPreset
} from "@/api/service/analysis-snapshot/analysis-context";
import { recomputeAnalysisSnapshot } from "@/api/service/analysis-snapshot/compute-analysis-snapshot";
import { listAnalysisContexts } from "@/api/service/analysis-snapshot/context-plan";

type ComputeAnalysisOptions = {
  month?: AnalysisMonth;
  prizeType?: AnalysisPrizeType;
  scope?: AnalysisScope;
  windowPreset?: AnalysisWindowPreset;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const contexts = buildComputePlan(options);

  console.info(
    `Compute analysis: recomputing ${contexts.length} context${contexts.length === 1 ? "" : "s"}.`
  );

  for (const [index, context] of contexts.entries()) {
    const label = [
      `[${index + 1}/${contexts.length}]`,
      `prizeType=${context.prizeType}`,
      `scope=${context.scope}`,
      `month=${context.month ?? "ALL"}`,
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

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Compute analysis failed: ${message}`);
  process.exitCode = 1;
});

function parseArgs(args: readonly string[]): ComputeAnalysisOptions {
  const values = Object.fromEntries(
    args.map((argument) => {
      const [key, value] = argument.replace(/^--/, "").split("=", 2);

      return [key, value];
    })
  );
  const prizeType = values.prizeType;
  const windowPreset = values.windowPreset;
  const scope = values.scope;
  const month = values.month ? Number(values.month) : undefined;
  let parsedPrizeType: AnalysisPrizeType | undefined;
  let parsedScope: AnalysisScope | undefined;
  let parsedWindowPreset: AnalysisWindowPreset | undefined;

  if (prizeType) {
    if (!isAnalysisPrizeType(prizeType)) {
      throw new Error(`Invalid --prizeType. Supported values: ${ANALYSIS_PRIZE_TYPES.join(", ")}`);
    }

    parsedPrizeType = prizeType;
  }

  if (windowPreset) {
    if (!isAnalysisWindowPreset(windowPreset)) {
      throw new Error(
        `Invalid --windowPreset. Supported values: ${ANALYSIS_WINDOW_PRESETS.join(", ")}`
      );
    }

    parsedWindowPreset = windowPreset;
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

  return {
    month: month as AnalysisMonth | undefined,
    prizeType: parsedPrizeType,
    scope: parsedScope,
    windowPreset: parsedWindowPreset
  };
}

function buildComputePlan(options: ComputeAnalysisOptions) {
  return listAnalysisContexts({
    month: options.month,
    prizeType: options.prizeType,
    scope: options.scope,
    windowPreset: options.windowPreset
  });
}
