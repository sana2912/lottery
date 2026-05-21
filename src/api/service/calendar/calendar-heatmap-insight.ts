import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import { ANALYSIS_WINDOW_PRESET } from "@/api/service/analysis-snapshot/analysis-context";
import type { AnalysisCalendarHeatmapReadModel } from "@/api/service/analysis-snapshot/calendar-heatmap-read-model";
import type {
  AnalysisPrizeSample,
  AnalysisSample
} from "@/api/service/analysis-snapshot/sample-resolver";
import {
  buildOverallPositionDigitStats,
  buildPositionHeatmapRows,
  type PositionHeatmapRow,
  sortPositionHeatmapCells
} from "@/api/service/analytics/position-heatmap";
import { deriveCalendarInsightMetadata } from "@/api/service/calendar/calendar-heatmap-metadata";
import { mapHeatmapRowsToPositionInsights } from "@/api/service/calendar/calendar-insights";
import {
  getExpectedPrizesPerDraw,
  getPrizesPerDrawActual
} from "@/api/service/lottery/prize-slots";
import type { CalendarHeatmapQuery, MonthlyInsight } from "@/schema/app/calendar.schema";

const MONTH_LABELS = [
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

import type { CalendarDataCompleteness } from "@/api/service/calendar/calendar-heatmap-metadata";

export type { CalendarDataCompleteness } from "@/api/service/calendar/calendar-heatmap-metadata";

export type CalendarMonthlyInsight = {
  coldNumbers: string[];
  dataCompleteness: CalendarDataCompleteness;
  drawCount: number;
  heatmapRows: ReturnType<typeof mapHeatmapRowsForCalendar>;
  hotNumbers: string[];
  id: string;
  label: string;
  month?: number;
  year?: number;
  opportunityCountPerPosition: number;
  patternNotes: string[];
  positionInsights: ReturnType<typeof mapHeatmapRowsToPositionInsights>;
  prizeType: NonNullable<MonthlyInsight["prizeType"]>;
  prizesPerDrawActual: number;
  prizesPerDrawExpected: number | null;
  sampleSize: number;
  scope: AnalysisContext["scope"];
  summary: string;
  windowPreset: AnalysisContext["windowPreset"];
  windowSize: number;
};

export function buildCalendarHeatmapInsight(
  context: AnalysisContext,
  sample: AnalysisSample
): CalendarMonthlyInsight | null {
  const sampleDraws = groupPrizesByDraw(sample.prizes);

  if (sampleDraws.length === 0) {
    return null;
  }

  const heatmapRows = buildPositionHeatmapRows(sampleDraws, context.numberLength);
  const metadata = deriveCalendarInsightMetadata(context, {
    drawCount: sample.drawCount,
    invalidPrizeCount: sample.invalidPrizeCount,
    prizeCount: sample.prizeCount,
    heatmapRows
  });

  return assembleCalendarMonthlyInsight(context, heatmapRows, metadata);
}

export function buildCalendarHeatmapInsightFromSnapshot(
  snapshot: AnalysisCalendarHeatmapReadModel,
  context: AnalysisContext,
  query: CalendarHeatmapQuery
) {
  const metadata =
    snapshot.drawCount !== undefined
      ? {
          dataCompleteness: snapshot.dataCompleteness ?? "complete",
          drawCount: snapshot.drawCount,
          invalidPrizeCount: snapshot.invalidPrizeCount ?? 0,
          opportunityCountPerPosition:
            snapshot.opportunityCountPerPosition ??
            snapshot.heatmapRows[0]?.cells[0]?.sampleEventCount ??
            0,
          prizeCount: snapshot.prizeCount ?? snapshot.sampleSize,
          prizesPerDrawActual:
            snapshot.prizesPerDrawActual ??
            getPrizesPerDrawActual(snapshot.drawCount, snapshot.prizeCount ?? 0),
          prizesPerDrawExpected:
            snapshot.prizesPerDrawExpected ?? getExpectedPrizesPerDraw(context.prizeType),
          summary: snapshot.summary
        }
      : deriveCalendarInsightMetadata(context, {
          drawCount: snapshot.sampleSize,
          invalidPrizeCount: 0,
          prizeCount:
            snapshot.prizesPerDrawActual !== undefined
              ? Math.round(snapshot.prizesPerDrawActual * snapshot.sampleSize)
              : inferPrizeCount(snapshot),
          heatmapRows: snapshot.heatmapRows
        });

  const insight = assembleCalendarMonthlyInsight(context, snapshot.heatmapRows, metadata);

  return {
    ...insight,
    month:
      query.scope === "MONTH" || (query.scope ?? snapshot.scope) === "MONTH"
        ? (query.month ?? snapshot.month ?? context.month)
        : undefined,
    year:
      query.scope === "MONTH" || (query.scope ?? snapshot.scope) === "MONTH"
        ? (query.year ?? context.year)
        : undefined,
    patternNotes: [
      "Cell colors rank digits within each position for the selected prize and scope only.",
      "Counts are prize-slot hits over actual opportunities in the sample (draws × prizes per draw).",
      "This insight is served from a precomputed analysis snapshot."
    ],
    scope: query.scope ?? snapshot.scope,
    windowPreset: ANALYSIS_WINDOW_PRESET,
    windowSize: metadata.drawCount
  };
}

function assembleCalendarMonthlyInsight(
  context: AnalysisContext,
  heatmapRows: PositionHeatmapRow[],
  metadata: ReturnType<typeof deriveCalendarInsightMetadata>
): CalendarMonthlyInsight {
  const overallDigitStats = buildOverallPositionDigitStats(heatmapRows);
  const rankedDigits = [...overallDigitStats.values()].sort(sortPositionHeatmapCells);
  const hotNumbers = rankedDigits.slice(0, 2).map((cell) => cell.digit);
  const coldNumbers = [...rankedDigits]
    .reverse()
    .slice(0, 2)
    .map((cell) => cell.digit);
  const month = context.scope === "MONTH" ? context.month : undefined;
  const year = context.scope === "MONTH" ? context.year : undefined;

  return {
    coldNumbers,
    dataCompleteness: metadata.dataCompleteness,
    drawCount: metadata.drawCount,
    heatmapRows: mapHeatmapRowsForCalendar(heatmapRows),
    hotNumbers,
    id: `monthly-insight-${context.scope}-${month ?? "all"}-${year ?? "any"}-${context.prizeType}`,
    label:
      context.scope === "MONTH" && month
        ? year
          ? `${MONTH_LABELS[month]} ${year}`
          : MONTH_LABELS[month]
        : "All months",
    month,
    year,
    opportunityCountPerPosition: metadata.opportunityCountPerPosition,
    patternNotes: [
      "Cell colors rank digits within each position for the selected prize and scope only.",
      "Counts are prize-slot hits over actual opportunities in the sample (draws × prizes per draw)."
    ],
    positionInsights: mapHeatmapRowsToPositionInsights(heatmapRows),
    prizeType: toCalendarInsightPrizeType(context.prizeType),
    prizesPerDrawActual: metadata.prizesPerDrawActual,
    prizesPerDrawExpected: metadata.prizesPerDrawExpected,
    sampleSize: metadata.drawCount,
    scope: context.scope,
    summary: metadata.summary,
    windowPreset: context.windowPreset,
    windowSize: metadata.drawCount
  };
}

function mapHeatmapRowsForCalendar(rows: readonly PositionHeatmapRow[]) {
  return rows.map((row) => ({
    cells: row.cells.map((cell) => ({
      appearanceCount: cell.appearanceCount,
      digit: cell.digit,
      eventCount: cell.eventCount,
      eventRatePercent: cell.eventRatePercent,
      expectedRatePercent: cell.expectedRatePercent,
      expectedPresenceRatePercent: cell.expectedPresenceRatePercent,
      hitCount: cell.eventCount,
      hitRatePercent: cell.eventRatePercent,
      lift: cell.lift,
      missingRounds: cell.missingRounds,
      opportunityCount: cell.sampleEventCount,
      presenceRatePercent: cell.presenceRatePercent,
      sampleEventCount: cell.sampleEventCount,
      score: cell.score,
      tone: cell.tone
    })),
    coldDigits: [...row.coldDigits],
    hotDigits: [...row.hotDigits],
    position: row.position
  }));
}

function groupPrizesByDraw(prizes: readonly AnalysisPrizeSample[]) {
  const drawByTime = new Map<number, { drawDate: Date; numbers: string[] }>();

  for (const prize of prizes) {
    const time = prize.draw.drawDate.getTime();
    const existing = drawByTime.get(time);

    if (existing) {
      existing.numbers.push(prize.number);
    } else {
      drawByTime.set(time, {
        drawDate: prize.draw.drawDate,
        numbers: [prize.number]
      });
    }
  }

  return [...drawByTime.values()].sort(
    (left, right) => left.drawDate.getTime() - right.drawDate.getTime()
  );
}

function inferPrizeCount(snapshot: AnalysisCalendarHeatmapReadModel) {
  const opportunity = snapshot.heatmapRows[0]?.cells[0]?.sampleEventCount ?? 0;

  return opportunity > 0 && snapshot.sampleSize > 0 ? Math.round(opportunity) : 0;
}

function toCalendarInsightPrizeType(
  prizeType: AnalysisContext["prizeType"]
): NonNullable<MonthlyInsight["prizeType"]> {
  if (prizeType === "SIX_DIGIT_ALL") {
    return "FIRST";
  }

  return prizeType;
}
