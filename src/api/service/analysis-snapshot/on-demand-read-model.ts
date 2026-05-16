import {
  type AnalysisContext,
  getAnalysisWindowLimit
} from "@/api/service/analysis-snapshot/analysis-context";
import { resolveAnalysisSample } from "@/api/service/analysis-snapshot/sample-resolver";
import { buildAnalyticsReadModelFromPrizes } from "@/api/service/analytics/analytics-engine";

export async function buildOnDemandAnalysisReadModel(
  context: AnalysisContext,
  computedAt = new Date()
) {
  const sample = await resolveAnalysisSample(context);
  const windowSize = getAnalysisWindowLimit(context.windowPreset) ?? sample.drawCount;

  return buildAnalyticsReadModelFromPrizes(
    sample.prizes,
    {
      lotteryType: context.lotteryType,
      numberLength: context.numberLength,
      page: 1,
      pageSize: 100,
      prizeType: context.prizeType,
      scope: context.scope,
      month: context.month,
      windowPreset: context.windowPreset,
      windowSize
    },
    computedAt
  );
}
