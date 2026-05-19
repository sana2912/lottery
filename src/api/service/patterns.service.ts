import {
  getAnalysisContextForFilterQuery,
  getAnalysisSnapshotPatternReadModel
} from "@/api/service/analysis-snapshot/snapshot-reader";
import type { ApiPatternsReadModel } from "@/schema/api/patterns";
import type { FilterContext } from "@/schema/app/query.schema";

export async function getPatternsReadModel(query: FilterContext): Promise<ApiPatternsReadModel> {
  const snapshot = await getAnalysisSnapshotPatternReadModel(query);

  if (snapshot) {
    return snapshot;
  }

  return getMissingPatternsReadModel(query);
}

export const patternsService = {
  getPatternsReadModel
} as const;

function getMissingPatternsReadModel(query: FilterContext): ApiPatternsReadModel {
  const context = getAnalysisContextForFilterQuery(query);
  const generatedAt = new Date().toISOString();

  return {
    context: {
      lotteryType: context?.lotteryType ?? query.lotteryType,
      month: context?.month,
      numberLength: context?.numberLength ?? query.numberLength ?? 2,
      prizeType: context?.prizeType ?? query.prizeType ?? "TWO_DIGIT",
      scope: context?.scope ?? query.scope ?? "ALL_TIME",
      windowPreset: context?.windowPreset ?? query.windowPreset ?? "50",
      windowSize:
        context?.windowPreset === "ALL"
          ? (query.windowSize ?? 0)
          : Number(context?.windowPreset ?? query.windowPreset ?? query.windowSize ?? 50)
    },
    generatedAt,
    pattern: {
      distribution: [],
      examples: [],
      overview: [],
      sampleSize: 0
    },
    source: "missing",
    summary: {
      drawCount: 0,
      generatedAt
    }
  };
}
