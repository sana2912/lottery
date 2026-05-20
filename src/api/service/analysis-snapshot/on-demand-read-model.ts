import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import { resolveAnalysisSample } from "@/api/service/analysis-snapshot/sample-resolver";
import { buildAnalyticsReadModelFromPrizes } from "@/api/service/analytics/analytics-engine";

export async function buildOnDemandAnalysisReadModel(
  context: AnalysisContext,
  computedAt = new Date()
) {
  const sample = await resolveAnalysisSample(context);

  return buildAnalyticsReadModelFromPrizes(sample.prizes, context, computedAt);
}
