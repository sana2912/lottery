import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import type { AnalysisPrizeSample } from "@/api/service/analysis-snapshot/sample-resolver";
import {
  buildPositionHeatmapRows,
  type PositionHeatmapCell
} from "@/api/service/analytics/position-heatmap";

export type AnalysisCalendarHeatmapReadModel = {
  heatmapRows: Array<{
    cells: PositionHeatmapCell[];
    coldDigits: string[];
    hotDigits: string[];
    position: number;
  }>;
  month?: number;
  sampleSize: number;
  scope: AnalysisContext["scope"];
  summary: string;
};

type SampleDraw = {
  drawDate: Date;
  numbers: string[];
};

export function buildAnalysisCalendarHeatmapReadModel(
  context: AnalysisContext,
  prizes: readonly AnalysisPrizeSample[]
): AnalysisCalendarHeatmapReadModel {
  const sampleDraws = groupPrizesByDraw(prizes);
  const heatmapRows = buildPositionHeatmapRows(sampleDraws, context.numberLength);

  return {
    heatmapRows,
    month: context.month,
    sampleSize: sampleDraws.length,
    scope: context.scope,
    summary: buildSummary(context, sampleDraws.length)
  };
}

function groupPrizesByDraw(prizes: readonly AnalysisPrizeSample[]): SampleDraw[] {
  const drawByDate = new Map<number, SampleDraw>();

  for (const prize of prizes) {
    const time = prize.draw.drawDate.getTime();
    const existing = drawByDate.get(time);

    if (existing) {
      existing.numbers.push(prize.number);
    } else {
      drawByDate.set(time, {
        drawDate: prize.draw.drawDate,
        numbers: [prize.number]
      });
    }
  }

  return [...drawByDate.values()].sort(
    (left, right) => left.drawDate.getTime() - right.drawDate.getTime()
  );
}

function buildSummary(context: AnalysisContext, sampleSize: number) {
  const scopeLabel = context.scope === "MONTH" ? `month ${context.month}` : "all months";

  return `${context.prizeType} ${scopeLabel} heatmap uses ${sampleSize} matching draws from preset ${context.windowPreset}.`;
}
