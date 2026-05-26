import { normalizeProductAnalysisQuery } from "@/lib/app/analysis-product-scope";
import {
  type CalendarHeatmapQuery,
  type CalendarReadModel,
  calendarHeatmapQuerySchema
} from "@/schema/app/calendar.schema";

export function getDaysUntilNextDraw(calendar: CalendarReadModel, now = new Date()) {
  const nextDrawDate = new Date(calendar.nextDraw.drawDateIso);

  return Math.max(0, Math.ceil((nextDrawDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export type CalendarPageFilters = {
  month?: number;
  prizeType: NonNullable<CalendarHeatmapQuery["prizeType"]>;
  scope: NonNullable<CalendarHeatmapQuery["scope"]>;
};

const CALENDAR_PRIZE_TYPE_OPTIONS = [
  { label: "เลขท้าย 2 ตัว", value: "TWO_DIGIT" },
  { label: "เลขหน้า 3 ตัว", value: "THREE_FRONT" },
  { label: "เลขท้าย 3 ตัว", value: "THREE_BACK" },
  { label: "First prize", value: "FIRST" },
  { label: "Near first", value: "NEAR_FIRST" },
  { label: "Prize 2", value: "PRIZE2" },
  { label: "Prize 3", value: "PRIZE3" },
  { label: "Prize 4", value: "PRIZE4" },
  { label: "Prize 5", value: "PRIZE5" }
] as const;

const CALENDAR_SCOPE_OPTIONS = [
  { label: "All months", value: "ALL_TIME" },
  { label: "Specific month", value: "MONTH" }
] as const;
const CALENDAR_MONTH_OPTIONS = [
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

export function parseCalendarPageFilters(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): CalendarPageFilters {
  const parsed = calendarHeatmapQuerySchema.parse(toSearchParamRecord(searchParams));
  const prizeType: CalendarPageFilters["prizeType"] = parsed.prizeType ?? "FIRST";
  const scope: CalendarPageFilters["scope"] = parsed.scope ?? "MONTH";
  const normalized = normalizeProductAnalysisQuery({
    lotteryType: "THAI_GOVERNMENT",
    page: 1,
    pageSize: 20,
    month: parsed.month,
    prizeType,
    scope
  });

  return {
    month: normalized.month,
    prizeType: normalized.prizeType,
    scope: normalized.scope
  };
}

export function toCalendarApiQuery(filters: CalendarPageFilters) {
  return {
    month: filters.month,
    prizeType: filters.prizeType,
    scope: filters.scope
  };
}

export function getCalendarMonthOptions() {
  return CALENDAR_MONTH_OPTIONS.map((label, index) => ({
    label,
    value: index + 1
  }));
}

export function getCalendarPrizeTypeOptions() {
  return [...CALENDAR_PRIZE_TYPE_OPTIONS];
}

export function getCalendarScopeOptions() {
  return [...CALENDAR_SCOPE_OPTIONS];
}

function toSearchParamRecord(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
) {
  if (!searchParams) {
    return {};
  }

  if (searchParams instanceof URLSearchParams) {
    return Object.fromEntries(searchParams.entries());
  }

  return searchParams;
}
