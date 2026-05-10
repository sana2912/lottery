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
  month: number;
  prizeType: NonNullable<CalendarHeatmapQuery["prizeType"]>;
  windowSize: number;
};

const CALENDAR_PRIZE_TYPE_OPTIONS = [
  { label: "First prize", value: "FIRST" },
  { label: "Near first", value: "NEAR_FIRST" },
  { label: "Prize 2", value: "PRIZE2" },
  { label: "Prize 3", value: "PRIZE3" },
  { label: "Prize 4", value: "PRIZE4" },
  { label: "Prize 5", value: "PRIZE5" }
] as const;

const CALENDAR_WINDOW_SIZE_OPTIONS = [8, 16, 24, 48, 96] as const;
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

  return {
    month: parsed.month ?? new Date().getUTCMonth() + 1,
    prizeType: parsed.prizeType ?? "FIRST",
    windowSize: parsed.windowSize ?? 24
  };
}

export function toCalendarApiQuery(filters: CalendarPageFilters) {
  return {
    month: filters.month,
    prizeType: filters.prizeType,
    windowSize: filters.windowSize
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

export function getCalendarWindowSizeOptions() {
  return [...CALENDAR_WINDOW_SIZE_OPTIONS];
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
