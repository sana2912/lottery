import type {
  ApiCalendarDraw,
  ApiCalendarReadModel,
  ApiMonthlyInsight
} from "@/schema/api/calendar";

type CalendarDrawDtoInput = Omit<ApiCalendarDraw, "drawDateIso"> & {
  drawDateIso: Date | string;
};

type CalendarReadModelDtoInput = Omit<
  ApiCalendarReadModel,
  "draws" | "generatedAt" | "monthlyInsights" | "nextDraw"
> & {
  draws: readonly CalendarDrawDtoInput[];
  generatedAt: Date | string;
  monthlyInsights: readonly MonthlyInsightDtoInput[];
  nextDraw: CalendarDrawDtoInput;
};

export function toApiCalendarDraw(draw: CalendarDrawDtoInput): ApiCalendarDraw {
  return {
    drawDate: draw.drawDate,
    drawDateIso: normalizeDateString(draw.drawDateIso),
    drawNo: draw.drawNo,
    id: draw.id,
    isNextDraw: draw.isNextDraw,
    status: draw.status
  };
}

type MonthlyInsightDtoInput = Omit<
  ApiMonthlyInsight,
  "coldNumbers" | "heatmapRows" | "hotNumbers" | "patternNotes" | "positionInsights"
> & {
  coldNumbers: readonly string[];
  heatmapRows: ReadonlyArray<{
    cells: ReadonlyArray<{
      appearanceCount: number;
      digit: string;
      eventCount?: number;
      eventRatePercent?: number;
      expectedPresenceRatePercent?: number;
      lift?: number;
      missingRounds: number;
      presenceRatePercent?: number;
      score: number;
      tone: "hot" | "warm" | "neutral" | "cool" | "cold";
    }>;
    coldDigits: readonly string[];
    hotDigits: readonly string[];
    position: number;
  }>;
  hotNumbers: readonly string[];
  patternNotes: readonly string[];
  positionInsights: ReadonlyArray<{
    coldNumbers: ReadonlyArray<{
      appearanceCount: number;
      digit: string;
      missingRounds: number;
    }>;
    hotNumbers: ReadonlyArray<{
      appearanceCount: number;
      digit: string;
      missingRounds: number;
    }>;
    position: number;
  }>;
};

export function toApiMonthlyInsight(insight: MonthlyInsightDtoInput): ApiMonthlyInsight {
  return {
    coldNumbers: [...insight.coldNumbers],
    heatmapRows: insight.heatmapRows.map((row) => ({
      cells: row.cells.map((cell) => ({ ...cell })),
      coldDigits: [...row.coldDigits],
      hotDigits: [...row.hotDigits],
      position: row.position
    })),
    hotNumbers: [...insight.hotNumbers],
    id: insight.id,
    label: insight.label,
    month: insight.month,
    patternNotes: [...insight.patternNotes],
    prizeType: insight.prizeType,
    scope: insight.scope,
    positionInsights: insight.positionInsights.map((positionInsight) => ({
      coldNumbers: positionInsight.coldNumbers.map((number) => ({ ...number })),
      hotNumbers: positionInsight.hotNumbers.map((number) => ({ ...number })),
      position: positionInsight.position
    })),
    sampleSize: insight.sampleSize,
    summary: insight.summary,
    windowPreset: insight.windowPreset,
    windowSize: insight.windowSize
  };
}

export function toApiCalendarReadModel(model: CalendarReadModelDtoInput): ApiCalendarReadModel {
  return {
    draws: model.draws.map(toApiCalendarDraw),
    generatedAt: normalizeDateString(model.generatedAt),
    monthlyInsights: model.monthlyInsights.map(toApiMonthlyInsight),
    nextDraw: toApiCalendarDraw(model.nextDraw),
    source: model.source
  };
}

function normalizeDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
