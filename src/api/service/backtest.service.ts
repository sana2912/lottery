import { randomUUID } from "node:crypto";
import { toApiBacktestHistoryResponse, toApiBacktestReadModel } from "@/api/model/dto/backtest.dto";
import { getBacktestSummary, runWalkForwardBacktest } from "@/api/service/backtest/walk-forward";
import { PREDICTION_ENGINE_VERSION } from "@/api/service/prediction/scoring-engine";
import { getPredictionStrategy } from "@/api/service/prediction/strategy-registry";
import { getPrisma } from "@/api/service/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { DateTimeFilter } from "@/generated/prisma/commonInputTypes";
import type { LotteryDrawWhereInput } from "@/generated/prisma/models/LotteryDraw";
import type { ApiBacktestReadModel, ApiBacktestResultExplanation } from "@/schema/api/backtest";
import type { BacktestRequest } from "@/schema/app/backtest.schema";

export async function runBacktest(input: BacktestRequest) {
  const prisma = getPrisma();
  const computedAt = new Date();
  const strategy = getPredictionStrategy(input.strategyId);
  const runId = randomUUID();
  const draws = await prisma.lotteryDraw.findMany({
    include: {
      prizes: true
    },
    orderBy: {
      drawDate: "asc"
    },
    where: buildDrawWhere(input)
  });
  const results = runWalkForwardBacktest({
    candidateCount: input.candidateCount,
    draws,
    numberLength: input.numberLength,
    prizeType: input.prizeType,
    runId,
    strategy,
    targetDrawCount: input.targetDrawCount,
    windowSize: input.windowSize
  });
  const summary = getBacktestSummary(results);
  const firstResult = results[0];
  const lastResult = results.at(-1);

  await prisma.$transaction(async (transaction) => {
    await transaction.backtestRun.create({
      data: {
        averageHitRank: summary.averageHitRank ?? null,
        candidateCount: input.candidateCount,
        computedAt,
        coverage: results.length,
        endDrawDate: lastResult ? new Date(lastResult.drawDate) : computedAt,
        hitRate: summary.hitRate,
        id: runId,
        longestMissStreak: summary.longestMissStreak,
        lotteryType: input.lotteryType,
        numberLength: input.numberLength ?? 2,
        params: toPrismaJson({
          ...input.params,
          expectedRandomHitRate: summary.expectedRandomHitRate,
          liftVsRandom: summary.liftVsRandom,
          resultExplanationsByResultId: toResultExplanationsByResultId(results),
          targetDrawCount: input.targetDrawCount,
          windowSize: input.windowSize
        }),
        prizeType: input.prizeType ?? "TWO_DIGIT",
        startDrawDate: firstResult ? new Date(firstResult.drawDate) : computedAt,
        strategyId: strategy.id,
        strategyName: strategy.name,
        version: PREDICTION_ENGINE_VERSION
      }
    });

    if (results.length > 0) {
      await transaction.backtestResult.createMany({
        data: results.map((result) => ({
          actualNumbers: result.actualNumbers,
          drawDate: new Date(result.drawDate),
          drawId: result.drawId,
          generatedNumbers: result.generatedNumbers,
          hitNumbers: result.hitNumbers,
          id: result.id,
          isHit: result.isHit,
          rankOfHit: result.rankOfHit ?? null,
          runId: result.runId
        }))
      });
    }
  });

  const persisted = await getBacktestById(runId);

  if (!persisted) {
    throw new Error("Backtest run was saved but could not be reloaded.");
  }

  return persisted;
}

export async function getBacktestById(id: string): Promise<ApiBacktestReadModel | null> {
  const prisma = getPrisma();
  const run = await prisma.backtestRun.findUnique({
    include: {
      results: {
        orderBy: {
          drawDate: "asc"
        }
      }
    },
    where: {
      id
    }
  });

  if (!run) {
    return null;
  }

  const params = (run.params ?? {}) as Record<string, unknown>;
  const resultExplanationsByResultId = getResultExplanationsByResultId(
    params.resultExplanationsByResultId
  );

  return toApiBacktestReadModel({
    generatedAt: run.computedAt,
    results: run.results.map((result) => ({
      actualNumbers: result.actualNumbers,
      drawDate: result.drawDate,
      drawId: result.drawId,
      generatedNumbers: result.generatedNumbers,
      hitNumbers: result.hitNumbers,
      id: result.id,
      isHit: result.isHit,
      explanation: resultExplanationsByResultId[result.id],
      rankOfHit: result.rankOfHit ?? undefined,
      runId: result.runId
    })),
    run: {
      averageHitRank: run.averageHitRank ?? undefined,
      candidateCount: run.candidateCount,
      computedAt: run.computedAt,
      coverage: run.coverage,
      endDrawDate: run.endDrawDate,
      expectedRandomHitRate: getOptionalNumber(params.expectedRandomHitRate),
      hitRate: run.hitRate,
      id: run.id,
      liftVsRandom: getOptionalNumber(params.liftVsRandom),
      longestMissStreak: run.longestMissStreak,
      lotteryType: run.lotteryType,
      numberLength: run.numberLength,
      params,
      prizeType: run.prizeType,
      startDrawDate: run.startDrawDate,
      strategyId: run.strategyId,
      strategyName: run.strategyName,
      version: run.version
    },
    source: "api"
  });
}

export async function listBacktests() {
  const prisma = getPrisma();
  const runs = await prisma.backtestRun.findMany({
    orderBy: {
      computedAt: "desc"
    },
    take: 8
  });

  return toApiBacktestHistoryResponse({
    generatedAt: new Date(),
    items: runs.map((run) => ({
      candidateCount: run.candidateCount,
      computedAt: run.computedAt,
      coverage: run.coverage,
      hitRate: run.hitRate,
      id: run.id,
      longestMissStreak: run.longestMissStreak,
      lotteryType: run.lotteryType,
      numberLength: run.numberLength,
      prizeType: run.prizeType,
      strategyId: run.strategyId,
      strategyName: run.strategyName,
      version: run.version
    })),
    source: "api"
  });
}

export const backtestService = {
  listBacktests,
  getBacktestById,
  runBacktest
} as const;

function buildDrawWhere(input: BacktestRequest): LotteryDrawWhereInput {
  const drawDate = buildDrawDateFilter(input);
  const where: LotteryDrawWhereInput = {
    lotteryType: input.lotteryType
  };

  if (drawDate) {
    where.drawDate = drawDate;
  }

  return where;
}

function buildDrawDateFilter(input: BacktestRequest): DateTimeFilter<"LotteryDraw"> | undefined {
  const filter: DateTimeFilter<"LotteryDraw"> = {};

  if (input.startDate) {
    filter.gte = new Date(input.startDate);
  }

  if (input.endDate) {
    filter.lte = new Date(input.endDate);
  } else {
    filter.lte = new Date();
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

function toPrismaJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function getOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toResultExplanationsByResultId(
  results: Awaited<ReturnType<typeof runWalkForwardBacktest>>
) {
  return Object.fromEntries(
    results
      .filter((result) => result.explanation)
      .map((result) => [result.id, result.explanation] as const)
  ) as Record<string, ApiBacktestResultExplanation>;
}

function getResultExplanationsByResultId(value: unknown) {
  if (!value || typeof value !== "object") {
    return {} as Record<string, ApiBacktestResultExplanation>;
  }

  return value as Record<string, ApiBacktestResultExplanation>;
}
