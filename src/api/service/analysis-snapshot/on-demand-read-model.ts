import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import { buildAnalysisReadModelsFromSample } from "@/api/service/analysis-snapshot/read-model-builder";
import { resolveAnalysisSample } from "@/api/service/analysis-snapshot/sample-resolver";

export async function buildOnDemandAnalysisReadModel(
  context: AnalysisContext,
  computedAt = new Date()
) {
  const sample = await resolveAnalysisSample(context);

  return buildAnalysisReadModelsFromSample(context, sample, computedAt).analyticsReadModel;
}
