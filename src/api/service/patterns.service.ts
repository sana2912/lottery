import { getAnalysisWindowLimit } from "@/api/service/analysis-snapshot/analysis-context";
import { buildOnDemandAnalysisReadModel } from "@/api/service/analysis-snapshot/on-demand-read-model";
import { buildAnalysisPatternReadModel } from "@/api/service/analysis-snapshot/pattern-read-model";
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

  const context = getAnalysisContextForFilterQuery(query);

  if (context) {
    console.warn(
      `patterns.snapshot miss for ${context.prizeType}/${context.scope}/${context.month ?? "ALL_MONTHS"}/${context.windowPreset}; using on-demand fallback.`
    );

    const analytics = await buildOnDemandAnalysisReadModel(context);
    const generatedAt = analytics.generatedAt;
    const windowSize = getAnalysisWindowLimit(context.windowPreset) ?? analytics.summary.drawCount;

    return {
      context: {
        lotteryType: context.lotteryType,
        month: context.month,
        numberLength: context.numberLength,
        prizeType: context.prizeType,
        scope: context.scope,
        windowPreset: context.windowPreset,
        windowSize
      },
      generatedAt,
      pattern: buildAnalysisPatternReadModel(analytics),
      source: "on-demand",
      summary: {
        drawCount: analytics.summary.drawCount,
        generatedAt
      }
    };
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
