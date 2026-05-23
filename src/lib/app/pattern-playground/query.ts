import { normalizeProductAnalysisQuery } from "@/lib/app/analysis-product-scope";
import { getPatternPrizeNumberLength } from "@/lib/app/pattern-playground/catalog";
import { getPredictionNumberLength } from "@/lib/app/prediction";
import type { ApiLotteryPrizeType } from "@/schema/api/query";
import type { FilterContext } from "@/schema/app/query.schema";

type PatternStatsPrizeType = Exclude<ApiLotteryPrizeType, "OTHER"> | "SIX_DIGIT_ALL";

export function toPatternStatsQueryForPrize(prizeType: PatternStatsPrizeType): FilterContext {
  const numberLength =
    prizeType === "SIX_DIGIT_ALL"
      ? getPatternPrizeNumberLength(prizeType)
      : getPredictionNumberLength(prizeType);

  return normalizeProductAnalysisQuery({
    lotteryType: "THAI_GOVERNMENT",
    numberLength,
    page: 1,
    pageSize: 100,
    prizeType,
    scope: "ALL_TIME",
    windowPreset: "ALL"
  });
}
