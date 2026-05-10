import {
  type CalendarPageFilters,
  parseCalendarPageFilters,
  toCalendarApiQuery
} from "@/frontend/pages/calendar/calendar.mappers";
import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type CalendarReadModel, calendarReadModelSchema } from "@/schema/app/calendar.schema";

export const calendarShell = calendarReadModelSchema.parse({
  generatedAt: "2026-04-28T00:00:00.000Z",
  monthlyInsights: [],
  nextDraw: {
    drawDate: "1 May 2026",
    drawDateIso: "2026-05-01T00:00:00.000Z",
    drawNo: "17/2026",
    id: "draw-2026-05-01",
    isNextDraw: true,
    status: "upcoming"
  },
  draws: [
    {
      drawDate: "1 May 2026",
      drawDateIso: "2026-05-01T00:00:00.000Z",
      drawNo: "17/2026",
      id: "draw-2026-05-01",
      isNextDraw: true,
      status: "upcoming"
    },
    {
      drawDate: "16 April 2026",
      drawDateIso: "2026-04-16T00:00:00.000Z",
      drawNo: "16/2026",
      id: "draw-2026-04-16",
      isNextDraw: false,
      status: "past"
    }
  ],
  source: "mock"
});

export type CalendarPageData =
  | { filters: CalendarPageFilters; model: CalendarReadModel; state: "error" }
  | { filters: CalendarPageFilters; model: CalendarReadModel; state: "ready" }
  | { filters: CalendarPageFilters; model: CalendarReadModel; state: "empty" };

export async function getCalendarPageData(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): Promise<CalendarPageData> {
  const filters = parseCalendarPageFilters(searchParams);

  try {
    const model = await apiGet<CalendarReadModel>(apiRoutes.calendar, {
      cache: "no-store",
      query: toCalendarApiQuery(filters),
      schema: calendarReadModelSchema
    });

    return {
      filters,
      model,
      state: model.draws.length > 0 ? "ready" : "empty"
    };
  } catch {
    return {
      filters,
      model: {
        ...calendarShell,
        draws: [],
        generatedAt: new Date().toISOString(),
        monthlyInsights: [],
        nextDraw: {
          ...calendarShell.nextDraw,
          drawDate: "-",
          drawNo: undefined
        },
        source: "mock"
      },
      state: "error"
    };
  }
}

export async function getCalendarModel(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): Promise<CalendarReadModel> {
  return (await getCalendarPageData(searchParams)).model;
}
