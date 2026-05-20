import type {
  AnalysisContext,
  AnalysisPrizeType
} from "@/api/service/analysis-snapshot/analysis-context";
import { getAnalysisPrizeSourceTypes } from "@/api/service/analysis-snapshot/analysis-context";

type PrizeLike = {
  position: number | null;
  type: string;
};

const THREE_DIGIT_FALLBACK_TYPE = "THREE_DIGIT";

export function getPrizeTypesForSampleQuery(prizeType: AnalysisPrizeType): readonly string[] {
  if (prizeType === "THREE_FRONT" || prizeType === "THREE_BACK") {
    return [prizeType, THREE_DIGIT_FALLBACK_TYPE];
  }

  return getAnalysisPrizeSourceTypes(prizeType);
}

export function matchesAnalysisPrizeSample(
  prize: PrizeLike,
  context: Pick<AnalysisContext, "prizeType">
): boolean {
  const prizeType = prize.type;

  if (context.prizeType === "THREE_FRONT") {
    if (prizeType === "THREE_FRONT") {
      return true;
    }

    return prizeType === THREE_DIGIT_FALLBACK_TYPE && prize.position === 1;
  }

  if (context.prizeType === "THREE_BACK") {
    if (prizeType === "THREE_BACK") {
      return true;
    }

    return prizeType === THREE_DIGIT_FALLBACK_TYPE && prize.position === 2;
  }

  return getPrizeTypesForSampleQuery(context.prizeType).includes(prizeType);
}

export function toAnalysisPrizeTypeLabel(
  prize: PrizeLike,
  context: Pick<AnalysisContext, "prizeType">
): AnalysisPrizeType {
  if (context.prizeType === "THREE_FRONT" || context.prizeType === "THREE_BACK") {
    return context.prizeType;
  }

  if (context.prizeType === "SIX_DIGIT_ALL") {
    return "SIX_DIGIT_ALL";
  }

  return prize.type as AnalysisPrizeType;
}
