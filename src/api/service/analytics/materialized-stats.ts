import { randomUUID } from "node:crypto";
import {
  buildAnalyticsReadModelFromPrizes,
  getPrizeWindow
} from "@/api/service/analytics/analytics-engine";
import { summarizePatterns } from "@/api/service/analytics/number-stats";
import { getPrisma } from "@/api/service/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { ApiAnalyticsReadModel, ApiDigitStat, ApiNumberStat } from "@/schema/api/analytics";
import type { FilterContext } from "@/schema/app/query.schema";

const MATERIALIZED_PRIZE_TYPES = [
  "TWO_DIGIT",
  "THREE_DIGIT",
  "FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5"
] as const;
const MATERIALIZED_WINDOW_SIZES = [30, 60, 120] as const;
const SNAPSHOT_INSERT_CHUNK_SIZE = 100;

type MaterializedDigitStatRow = Omit<ApiDigitStat, "computedAt" | "lastSeenDrawDate"> & {
  computedAt: Date;
  lastSeenDrawDate: Date | null;
};

type MaterializedNumberStatRow = Omit<
  ApiNumberStat,
  "computedAt" | "lastSeenDrawDate" | "patternFlags"
> & {
  computedAt: Date;
  lastSeenDrawDate: Date | null;
  patternFlags: unknown;
};

export type MaterializedContext = {
  lotteryType: FilterContext["lotteryType"];
  numberLength?: FilterContext["numberLength"];
  prizeType: NonNullable<FilterContext["prizeType"]>;
  windowSize: number;
};

export type MaterializedStatsSummary = {
  computedAt: string;
  digitStats: number;
  drawCount: number;
  numberStats: number;
  prizeType: MaterializedContext["prizeType"];
  windowSize: number;
};

type MaterializedPrizeType = (typeof MATERIALIZED_PRIZE_TYPES)[number];
type IncrementalMaterializedRange = {
  endDate?: string;
  lotteryType?: FilterContext["lotteryType"];
  startDate: string;
};

export async function getMaterializedAnalyticsReadModel(query: FilterContext) {
  if (!isMaterializedStatsEligible(query)) {
    return null;
  }

  const prisma = getPrisma();
  const context = toMaterializedContext(query);
  const [latestRow] = await prisma.$queryRaw<Array<{ computedAt: Date }>>`
    SELECT "computedAt"
    FROM "number_stat_snapshots"
    WHERE
      "lotteryType" = ${context.lotteryType}::"LotteryType"
      AND "prizeType" = ${context.prizeType}::"LotteryPrizeType"
      AND "windowSize" = ${context.windowSize}
    ORDER BY "computedAt" DESC
    LIMIT 1
  `;

  if (!latestRow) {
    return null;
  }

  const [digitStats, numberStats] = await Promise.all([
    prisma.$queryRaw<MaterializedDigitStatRow[]>`
      SELECT
        "lotteryType",
        "prizeType",
        "digit",
        "position",
        "windowSize",
        "drawCount",
        "hitCount",
        "frequencyPercent",
        "lastSeenDrawDate",
        "missingDrawCount",
        "trendDirection",
        "computedAt"
      FROM "digit_stat_snapshots"
      WHERE
        "lotteryType" = ${context.lotteryType}::"LotteryType"
        AND "prizeType" = ${context.prizeType}::"LotteryPrizeType"
        AND "windowSize" = ${context.windowSize}
        AND "computedAt" = ${latestRow.computedAt}
      ORDER BY "hitCount" DESC, "prizeType" ASC, COALESCE("position", 0) ASC, "digit" ASC
    `,
    prisma.$queryRaw<MaterializedNumberStatRow[]>`
      SELECT
        "lotteryType",
        "prizeType",
        "number",
        "numberLength",
        "windowSize",
        "drawCount",
        "hitCount",
        "frequencyPercent",
        "lastSeenDrawDate",
        "missingDrawCount",
        "averageGap",
        "maxGap",
        "trendScore",
        "patternFlags",
        "computedAt"
      FROM "number_stat_snapshots"
      WHERE
        "lotteryType" = ${context.lotteryType}::"LotteryType"
        AND "prizeType" = ${context.prizeType}::"LotteryPrizeType"
        AND "windowSize" = ${context.windowSize}
        AND "computedAt" = ${latestRow.computedAt}
      ORDER BY "trendScore" DESC, "hitCount" DESC
    `
  ]);

  if (numberStats.length === 0) {
    return null;
  }

  const apiDigitStats = digitStats.map((stat) => ({
    ...stat,
    computedAt: stat.computedAt.toISOString(),
    lastSeenDrawDate: stat.lastSeenDrawDate?.toISOString(),
    lotteryType: String(stat.lotteryType),
    prizeType: String(stat.prizeType),
    position: stat.position ?? undefined
  }));
  const apiNumberStats = numberStats.map((stat) => ({
    ...stat,
    computedAt: stat.computedAt.toISOString(),
    lastSeenDrawDate: stat.lastSeenDrawDate?.toISOString(),
    lotteryType: String(stat.lotteryType),
    patternFlags: Array.isArray(stat.patternFlags)
      ? (stat.patternFlags as ApiNumberStat["patternFlags"])
      : [],
    prizeType: String(stat.prizeType)
  }));
  const drawCount = apiNumberStats[0]?.drawCount ?? 0;

  return {
    digitStats: apiDigitStats,
    generatedAt: latestRow.computedAt.toISOString(),
    numberStats: apiNumberStats,
    patternSummaries: summarizePatterns(apiNumberStats, drawCount),
    source: "api",
    summary: {
      drawCount,
      generatedAt: latestRow.computedAt.toISOString()
    }
  } satisfies ApiAnalyticsReadModel;
}

export async function computeMaterializedStats() {
  const summaries: MaterializedStatsSummary[] = [];

  for (const prizeType of MATERIALIZED_PRIZE_TYPES) {
    for (const windowSize of MATERIALIZED_WINDOW_SIZES) {
      summaries.push(await recomputeMaterializedStatsContext({ prizeType, windowSize }));
    }
  }

  return summaries;
}

export async function getIncrementalMaterializedContexts(range: IncrementalMaterializedRange) {
  const prisma = getPrisma();
  const lotteryType = range.lotteryType ?? "THAI_GOVERNMENT";
  const startDate = new Date(range.startDate);
  const endDate = range.endDate ? new Date(range.endDate) : new Date();
  const prizeTypes = await prisma.$queryRaw<Array<{ prizeType: MaterializedPrizeType }>>`
    SELECT DISTINCT prize."type" AS "prizeType"
    FROM "lottery_prizes" AS prize
    INNER JOIN "lottery_draws" AS draw
      ON draw."_id" = prize."drawId"
    WHERE
      draw."lotteryType" = ${lotteryType}::"LotteryType"
      AND draw."drawDate" >= ${startDate}
      AND draw."drawDate" <= ${endDate}
      AND prize."type" IN (${Prisma.join(
        MATERIALIZED_PRIZE_TYPES.map((prizeType) => Prisma.sql`${prizeType}::"LotteryPrizeType"`)
      )})
    ORDER BY prize."type" ASC
  `;

  return prizeTypes.flatMap(({ prizeType }) =>
    MATERIALIZED_WINDOW_SIZES.map((windowSize) => ({
      lotteryType,
      numberLength: getExpectedNumberLength(prizeType),
      prizeType,
      windowSize
    }))
  );
}

export async function recomputeMaterializedStatsContext(
  partialContext: Pick<MaterializedContext, "prizeType" | "windowSize"> &
    Partial<Pick<MaterializedContext, "lotteryType" | "numberLength">>
) {
  const context: MaterializedContext = {
    lotteryType: partialContext.lotteryType ?? "THAI_GOVERNMENT",
    numberLength: partialContext.numberLength ?? getExpectedNumberLength(partialContext.prizeType),
    prizeType: partialContext.prizeType,
    windowSize: partialContext.windowSize
  };
  const prisma = getPrisma();
  const computedAt = new Date();
  const readModel = buildAnalyticsReadModelFromPrizes(
    await getPrizeWindow(prisma, {
      lotteryType: context.lotteryType,
      numberLength: context.numberLength,
      page: 1,
      pageSize: 20,
      prizeType: context.prizeType,
      windowSize: context.windowSize
    }),
    {
      lotteryType: context.lotteryType,
      numberLength: context.numberLength,
      page: 1,
      pageSize: 20,
      prizeType: context.prizeType,
      windowSize: context.windowSize
    },
    computedAt
  );

  await prisma.$executeRaw`
    DELETE FROM "digit_stat_snapshots"
    WHERE
      "lotteryType" = ${context.lotteryType}::"LotteryType"
      AND "prizeType" = ${context.prizeType}::"LotteryPrizeType"
      AND "windowSize" = ${context.windowSize}
  `;
  await prisma.$executeRaw`
    DELETE FROM "number_stat_snapshots"
    WHERE
      "lotteryType" = ${context.lotteryType}::"LotteryType"
      AND "prizeType" = ${context.prizeType}::"LotteryPrizeType"
      AND "windowSize" = ${context.windowSize}
  `;

  for (const digitChunk of chunk(readModel.digitStats, SNAPSHOT_INSERT_CHUNK_SIZE)) {
    for (const stat of digitChunk) {
      await prisma.$executeRaw`
        INSERT INTO "digit_stat_snapshots" (
          "_id",
          "lotteryType",
          "prizeType",
          "windowSize",
          "digit",
          "position",
          "drawCount",
          "hitCount",
          "frequencyPercent",
          "lastSeenDrawDate",
          "missingDrawCount",
          "trendDirection",
          "computedAt",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${randomUUID()}::uuid,
          ${stat.lotteryType}::"LotteryType",
          ${stat.prizeType}::"LotteryPrizeType",
          ${stat.windowSize},
          ${stat.digit},
          ${stat.position ?? null},
          ${stat.drawCount},
          ${stat.hitCount},
          ${stat.frequencyPercent},
          ${stat.lastSeenDrawDate ? new Date(stat.lastSeenDrawDate) : null},
          ${stat.missingDrawCount},
          ${stat.trendDirection},
          ${computedAt},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `;
    }
  }

  for (const numberChunk of chunk(readModel.numberStats, SNAPSHOT_INSERT_CHUNK_SIZE)) {
    for (const stat of numberChunk) {
      await prisma.$executeRaw`
        INSERT INTO "number_stat_snapshots" (
          "_id",
          "lotteryType",
          "prizeType",
          "windowSize",
          "number",
          "numberLength",
          "drawCount",
          "hitCount",
          "frequencyPercent",
          "lastSeenDrawDate",
          "missingDrawCount",
          "averageGap",
          "maxGap",
          "trendScore",
          "patternFlags",
          "computedAt",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${randomUUID()}::uuid,
          ${stat.lotteryType}::"LotteryType",
          ${stat.prizeType}::"LotteryPrizeType",
          ${stat.windowSize},
          ${stat.number},
          ${stat.numberLength},
          ${stat.drawCount},
          ${stat.hitCount},
          ${stat.frequencyPercent},
          ${stat.lastSeenDrawDate ? new Date(stat.lastSeenDrawDate) : null},
          ${stat.missingDrawCount},
          ${stat.averageGap ?? null},
          ${stat.maxGap ?? null},
          ${stat.trendScore},
          ${JSON.stringify(stat.patternFlags)}::jsonb,
          ${computedAt},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `;
    }
  }

  return {
    computedAt: computedAt.toISOString(),
    digitStats: readModel.digitStats.length,
    drawCount: readModel.summary.drawCount,
    numberStats: readModel.numberStats.length,
    prizeType: context.prizeType,
    windowSize: context.windowSize
  };
}

function isMaterializedStatsEligible(query: FilterContext) {
  if (
    !query.prizeType ||
    !MATERIALIZED_PRIZE_TYPES.includes(query.prizeType as (typeof MATERIALIZED_PRIZE_TYPES)[number])
  ) {
    return false;
  }

  if (
    !MATERIALIZED_WINDOW_SIZES.includes(
      query.windowSize as (typeof MATERIALIZED_WINDOW_SIZES)[number]
    )
  ) {
    return false;
  }

  if (query.startDate || query.endDate || query.year || query.month || query.q) {
    return false;
  }

  const expectedNumberLength = getExpectedNumberLength(query.prizeType);

  return query.numberLength === undefined || query.numberLength === expectedNumberLength;
}

export function isCanonicalMaterializedContext(query: FilterContext) {
  return isMaterializedStatsEligible(query);
}

export function getMaterializedContextCatalog() {
  return {
    lotteryType: "THAI_GOVERNMENT" as const,
    prizeTypes: [...MATERIALIZED_PRIZE_TYPES],
    windowSizes: [...MATERIALIZED_WINDOW_SIZES]
  };
}

function toMaterializedContext(query: FilterContext): MaterializedContext {
  return {
    lotteryType: query.lotteryType,
    numberLength: query.numberLength,
    prizeType: query.prizeType as MaterializedContext["prizeType"],
    windowSize: query.windowSize
  };
}

function getExpectedNumberLength(prizeType: NonNullable<FilterContext["prizeType"]>) {
  switch (prizeType) {
    case "TWO_DIGIT":
      return 2;
    case "THREE_DIGIT":
      return 3;
    case "FIRST":
    case "PRIZE2":
    case "PRIZE3":
    case "PRIZE4":
    case "PRIZE5":
      return 6;
    default:
      return undefined;
  }
}

function chunk<T>(items: readonly T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
