import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import type { PositionHeatmapRow } from "@/api/service/analytics/position-heatmap";
import {
  getCalendarDataCompleteness,
  getExpectedPrizesPerDraw,
  getPrizesPerDrawActual
} from "@/api/service/lottery/prize-slots";

export type CalendarDataCompleteness = "complete" | "partial";

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

export function deriveCalendarInsightMetadata(
  context: AnalysisContext,
  input: {
    drawCount: number;
    heatmapRows: PositionHeatmapRow[];
    invalidPrizeCount: number;
    prizeCount: number;
  }
) {
  const prizesPerDrawExpected = getExpectedPrizesPerDraw(context.prizeType);
  const prizesPerDrawActual = getPrizesPerDrawActual(input.drawCount, input.prizeCount);
  const opportunityCountPerPosition = input.heatmapRows[0]?.cells[0]?.sampleEventCount ?? 0;
  const scopeLabel =
    context.scope === "MONTH"
      ? context.year !== undefined
        ? `${MONTH_NAMES[context.month ?? 1]} ${context.year}`
        : `month ${context.month} (all years)`
      : "all months";

  return {
    dataCompleteness: getCalendarDataCompleteness({
      expected: prizesPerDrawExpected,
      invalidPrizeCount: input.invalidPrizeCount,
      prizesPerDrawActual
    }),
    drawCount: input.drawCount,
    invalidPrizeCount: input.invalidPrizeCount,
    opportunityCountPerPosition,
    prizeCount: input.prizeCount,
    prizesPerDrawActual,
    prizesPerDrawExpected,
    summary: `${context.prizeType} ${scopeLabel} heatmap uses ${input.drawCount} eligible draws (${input.prizeCount} prize rows), full sample in scope.`
  };
}
