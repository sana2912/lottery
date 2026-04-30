import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type CalendarReadModel, calendarReadModelSchema } from "@/schema/app/calendar.schema";

const calendarShell = calendarReadModelSchema.parse({
  generatedAt: "2026-04-28T00:00:00.000Z",
  monthlyInsights: [
    {
      coldNumbers: ["03", "91"],
      hotNumbers: ["47", "24"],
      id: "monthly-insight-may",
      label: "May",
      month: 5,
      patternNotes: [
        "Odd-ending numbers appeared slightly more often in the sampled month.",
        "High-ending numbers carried more weight in same-month history."
      ],
      sampleSize: 12,
      summary:
        "May has 12 historical draws in sample, leaning toward odd-ending and high-ending numbers."
    }
  ],
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
  | { model: CalendarReadModel; state: "error" }
  | { model: CalendarReadModel; state: "ready" }
  | { model: CalendarReadModel; state: "empty" };

export async function getCalendarPageData(): Promise<CalendarPageData> {
  try {
    const model = await apiGet<CalendarReadModel>(apiRoutes.calendar, {
      cache: "no-store",
      schema: calendarReadModelSchema
    });

    return {
      model,
      state: model.draws.length > 0 ? "ready" : "empty"
    };
  } catch {
    return {
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

export async function getCalendarModel(): Promise<CalendarReadModel> {
  return (await getCalendarPageData()).model;
}
