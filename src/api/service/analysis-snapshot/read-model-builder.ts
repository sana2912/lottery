import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import { buildAnalysisCalendarHeatmapReadModel } from "@/api/service/analysis-snapshot/calendar-heatmap-read-model";
import { buildAnalysisPatternReadModel } from "@/api/service/analysis-snapshot/pattern-read-model";
import type { AnalysisSample } from "@/api/service/analysis-snapshot/sample-resolver";
import { buildAnalyticsReadModelFromPrizes } from "@/api/service/analytics/analytics-engine";

export function buildAnalysisReadModelsFromSample(
  context: AnalysisContext,
  sample: AnalysisSample,
  computedAt: Date
) {
  const analyticsReadModel = buildAnalyticsReadModelFromPrizes(sample.prizes, context, computedAt, {
    drawCount: sample.drawCount,
    prizeCount: sample.prizeCount
  });
  const patternReadModel = buildAnalysisPatternReadModel(analyticsReadModel);
  const calendarReadModel = buildAnalysisCalendarHeatmapReadModel(context, sample.prizes, {
    drawCount: sample.drawCount,
    invalidPrizeCount: sample.invalidPrizeCount,
    prizeCount: sample.prizeCount
  });

  return {
    analyticsReadModel,
    calendarReadModel,
    patternReadModel
  };
}
