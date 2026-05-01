import {
  getIncrementalMaterializedContexts,
  getMaterializedContextCatalog,
  type MaterializedContext,
  recomputeMaterializedStatsContext
} from "@/api/service/analytics/materialized-stats";

type SingleContextOptions = Pick<MaterializedContext, "prizeType" | "windowSize">;
type IncrementalOptions = {
  endDate?: string;
  startDate: string;
};
type ComputeStatsOptions = IncrementalOptions | SingleContextOptions | Record<string, never>;

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const plan = await getComputePlan(options);
  const summaries = [];

  console.info(
    `Compute stats: recomputing ${plan.contexts.length} context${
      plan.contexts.length === 1 ? "" : "s"
    }.`
  );

  for (const [index, context] of plan.contexts.entries()) {
    const label = `[${index + 1}/${plan.contexts.length}] prizeType=${context.prizeType} window=${context.windowSize}`;
    const startedAt = Date.now();

    console.info(`${label} starting...`);
    const summary = await recomputeMaterializedStatsContext(context);
    const durationMs = Date.now() - startedAt;

    summaries.push(summary);
    console.info(
      [
        `${label} done in ${Math.round(durationMs / 1000)}s.`,
        `Draws: ${summary.drawCount}.`,
        `Digit stats: ${summary.digitStats}.`,
        `Number stats: ${summary.numberStats}.`,
        `Computed at: ${summary.computedAt}.`
      ].join(" ")
    );
  }

  const totalDraws = summaries.reduce((sum, summary) => sum + summary.drawCount, 0);
  const totalDigitStats = summaries.reduce((sum, summary) => sum + summary.digitStats, 0);
  const totalNumberStats = summaries.reduce((sum, summary) => sum + summary.numberStats, 0);
  const latestComputedAt = summaries
    .map((summary) => summary.computedAt)
    .sort((left, right) => right.localeCompare(left))[0];

  console.info(
    [
      `Requested ${plan.requestedContexts} materialized context${plan.requestedContexts === 1 ? "" : "s"}.`,
      `Recomputed ${summaries.length}.`,
      `Skipped ${Math.max(0, plan.requestedContexts - summaries.length)}.`,
      `Draw rows covered: ${totalDraws}.`,
      `Digit snapshot rows: ${totalDigitStats}.`,
      `Number snapshot rows: ${totalNumberStats}.`,
      latestComputedAt ? `Latest computedAt: ${latestComputedAt}.` : ""
    ]
      .filter(Boolean)
      .join(" ")
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Compute stats failed: ${message}`);
  process.exitCode = 1;
});

function parseArgs(args: readonly string[]): ComputeStatsOptions {
  const values = Object.fromEntries(
    args.map((argument) => {
      const [key, value] = argument.replace(/^--/, "").split("=", 2);

      return [key, value];
    })
  );
  const catalog = getMaterializedContextCatalog();
  const prizeType = values.prizeType;
  const windowSize = values.windowSize ? Number(values.windowSize) : undefined;
  const startDate = values.startDate;
  const endDate = values.endDate;

  if (!prizeType && !windowSize && !startDate && !endDate) {
    return {};
  }

  if (startDate || endDate) {
    if (!startDate) {
      throw new Error("Missing --startDate for incremental recompute mode.");
    }

    return {
      endDate,
      startDate
    };
  }

  if (
    !prizeType ||
    !catalog.prizeTypes.includes(prizeType as (typeof catalog.prizeTypes)[number])
  ) {
    throw new Error(
      `Invalid or missing --prizeType. Supported values: ${catalog.prizeTypes.join(", ")}`
    );
  }

  if (
    !windowSize ||
    !catalog.windowSizes.includes(windowSize as (typeof catalog.windowSizes)[number])
  ) {
    throw new Error(
      `Invalid or missing --windowSize. Supported values: ${catalog.windowSizes.join(", ")}`
    );
  }

  return {
    prizeType: prizeType as (typeof catalog.prizeTypes)[number],
    windowSize
  };
}

async function getComputePlan(options: ReturnType<typeof parseArgs>) {
  if (isSingleContextOptions(options)) {
    return {
      contexts: [options],
      requestedContexts: 1
    };
  }

  if (isIncrementalOptions(options)) {
    const contexts = await getIncrementalMaterializedContexts(options);

    return {
      contexts,
      requestedContexts: contexts.length
    };
  }

  const contexts = await computeFullContextPlan();

  return {
    contexts,
    requestedContexts: contexts.length
  };
}

async function computeFullContextPlan() {
  const catalog = getMaterializedContextCatalog();

  return catalog.prizeTypes.flatMap((prizeType) =>
    catalog.windowSizes.map((windowSize) => ({
      prizeType,
      windowSize
    }))
  );
}

function isSingleContextOptions(options: ComputeStatsOptions): options is SingleContextOptions {
  return "prizeType" in options && "windowSize" in options;
}

function isIncrementalOptions(options: ComputeStatsOptions): options is IncrementalOptions {
  return "startDate" in options;
}
