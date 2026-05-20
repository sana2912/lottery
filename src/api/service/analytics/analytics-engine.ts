import { toApiAnalyticsReadModel } from "@/api/model/dto/analytics.dto";
import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import { isGroupedAnalysisPrizeType } from "@/api/service/analysis-snapshot/analysis-context";
import type { AnalysisPrizeSample } from "@/api/service/analysis-snapshot/sample-resolver";
import { extractDigitEvents } from "@/api/service/analytics/digit-events";
import {
  calculateDigitStats,
  calculateNumberStats,
  summarizePatterns
} from "@/api/service/analytics/number-stats";
import type { ApiAnalyticsReadModel } from "@/schema/api/analytics";
import type { FilterContext } from "@/schema/app/query.schema";

export type AnalyticsQuery = FilterContext;

export function buildAnalyticsReadModelFromPrizes(
  prizes: readonly AnalysisPrizeSample[],
  context: Pick<
    AnalysisContext,
    "lotteryType" | "numberLength" | "prizeType" | "scope" | "month" | "year" | "windowPreset"
  >,
  computedAt: Date
): ApiAnalyticsReadModel {
  const normalizedPrizes = prizes.map((prize) => ({
    ...prize,
    type: isGroupedAnalysisPrizeType(context.prizeType) ? context.prizeType : prize.type
  }));
  const drawCount = new Set(normalizedPrizes.map((prize) => prize.drawId)).size;
  const prizeCount = normalizedPrizes.filter(
    (prize) => prize.number.length === context.numberLength
  ).length;
  const statsContext = {
    computedAt,
    drawCount,
    windowSize: drawCount
  };
  const digitStats = calculateDigitStats(extractDigitEvents(normalizedPrizes), statsContext);
  const numberStats = calculateNumberStats(normalizedPrizes, statsContext, context.numberLength);

  return toApiAnalyticsReadModel({
    digitStats,
    generatedAt: computedAt,
    numberStats,
    patternSummaries: summarizePatterns(numberStats, drawCount),
    source: "api",
    summary: {
      drawCount,
      generatedAt: computedAt,
      prizeCount
    }
  });
}

export function buildEmptyAnalyticsReadModel(
  _query: AnalyticsQuery,
  computedAt = new Date()
): ApiAnalyticsReadModel {
  return toApiAnalyticsReadModel({
    digitStats: [],
    generatedAt: computedAt,
    numberStats: [],
    patternSummaries: [],
    source: "api",
    summary: {
      drawCount: 0,
      generatedAt: computedAt,
      prizeCount: 0
    }
  });
}
