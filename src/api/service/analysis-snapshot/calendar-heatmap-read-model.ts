import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import type { AnalysisPrizeSample } from "@/api/service/analysis-snapshot/sample-resolver";
import {
  buildPositionHeatmapRows,
  type PositionHeatmapCell
} from "@/api/service/analytics/position-heatmap";
import type { CalendarDataCompleteness } from "@/api/service/calendar/calendar-heatmap-metadata";
import { deriveCalendarInsightMetadata } from "@/api/service/calendar/calendar-heatmap-metadata";

export type AnalysisCalendarHeatmapReadModel = {
  dataCompleteness: CalendarDataCompleteness;
  drawCount: number;
  heatmapRows: Array<{
    cells: PositionHeatmapCell[];
    coldDigits: string[];
    hotDigits: string[];
    position: number;
  }>;
  invalidPrizeCount: number;
  month?: number;
  opportunityCountPerPosition: number;
  prizeCount: number;
  prizesPerDrawActual: number;
  prizesPerDrawExpected: number | null;
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
  prizes: readonly AnalysisPrizeSample[],
  sample: { drawCount: number; invalidPrizeCount: number; prizeCount: number }
): AnalysisCalendarHeatmapReadModel {
  const sampleDraws = groupPrizesByDraw(prizes);
  const heatmapRows = buildPositionHeatmapRows(sampleDraws, context.numberLength);
  const metadata = deriveCalendarInsightMetadata(context, {
    drawCount: sample.drawCount,
    heatmapRows,
    invalidPrizeCount: sample.invalidPrizeCount,
    prizeCount: sample.prizeCount
  });

  return {
    dataCompleteness: metadata.dataCompleteness,
    drawCount: metadata.drawCount,
    heatmapRows,
    invalidPrizeCount: sample.invalidPrizeCount,
    month: context.month,
    opportunityCountPerPosition: metadata.opportunityCountPerPosition,
    prizeCount: sample.prizeCount,
    prizesPerDrawActual: metadata.prizesPerDrawActual,
    prizesPerDrawExpected: metadata.prizesPerDrawExpected,
    sampleSize: sampleDraws.length,
    scope: context.scope,
    summary: metadata.summary
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
