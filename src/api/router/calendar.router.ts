import { Elysia } from "elysia";
import { calendarService } from "@/api/service/calendar.service";
import { calendarHeatmapQuerySchema } from "@/schema/app/calendar.schema";
import { parseQuery } from "@/util/api/query";

export const calendarRouter = new Elysia({ prefix: "/calendar" }).get("/", ({ request }) =>
  calendarService.getCalendarReadModel(parseQuery(request, calendarHeatmapQuerySchema))
);
