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
  windowPreset: NonNullable<CalendarHeatmapQuery["windowPreset"]>;
  windowSize: number;
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
const CALENDAR_WINDOW_PRESET_OPTIONS = [
  { label: "50 draws", value: "50" },
  { label: "100 draws", value: "100" },
  { label: "500 draws", value: "500" },
  { label: "All draws", value: "ALL" }
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
  const scope = parsed.scope ?? "MONTH";
  const windowPreset = parsed.windowPreset ?? toWindowPreset(parsed.windowSize) ?? "50";

  return {
    month: scope === "MONTH" ? (parsed.month ?? new Date().getUTCMonth() + 1) : undefined,
    prizeType: parsed.prizeType ?? "FIRST",
    scope,
    windowPreset,
    windowSize: windowPreset === "ALL" ? 500 : Number(windowPreset)
  };
}

export function toCalendarApiQuery(filters: CalendarPageFilters) {
  return {
    month: filters.month,
    prizeType: filters.prizeType,
    scope: filters.scope,
    windowPreset: filters.windowPreset,
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

export function getCalendarScopeOptions() {
  return [...CALENDAR_SCOPE_OPTIONS];
}

export function getCalendarWindowPresetOptions() {
  return [...CALENDAR_WINDOW_PRESET_OPTIONS];
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

function toWindowPreset(windowSize: number | undefined) {
  if (windowSize === 50 || windowSize === 100 || windowSize === 500) {
    return String(windowSize) as "50" | "100" | "500";
  }

  return undefined;
}
