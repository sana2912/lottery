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
  "coldNumbers" | "hotNumbers" | "patternNotes"
> & {
  coldNumbers: readonly string[];
  hotNumbers: readonly string[];
  patternNotes: readonly string[];
};

export function toApiMonthlyInsight(insight: MonthlyInsightDtoInput): ApiMonthlyInsight {
  return {
    coldNumbers: [...insight.coldNumbers],
    hotNumbers: [...insight.hotNumbers],
    id: insight.id,
    label: insight.label,
    month: insight.month,
    patternNotes: [...insight.patternNotes],
    sampleSize: insight.sampleSize,
    summary: insight.summary
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
