import { calendarService } from "@/api/service/calendar.service";
import { CalendarPage } from "@/frontend/pages/calendar";
import { calendarShell } from "@/frontend/pages/calendar/calendar.data";
import { parseCalendarPageFilters } from "@/frontend/pages/calendar/calendar.mappers";

export default async function CalendarRoute({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const filters = parseCalendarPageFilters(rawSearchParams);

  let pageData: {
    filters: typeof filters;
    model: typeof calendarShell;
    state: "ready" | "empty" | "error";
  };

  try {
    const model = await calendarService.getCalendarReadModel(filters);
    pageData = { filters, model, state: model.draws.length > 0 ? "ready" : "empty" };
  } catch {
    pageData = { filters, model: calendarShell, state: "error" };
  }

  return <CalendarPage pageData={pageData} searchParams={rawSearchParams} />;
}
