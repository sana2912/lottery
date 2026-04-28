import { Elysia } from "elysia";
import { calendarService } from "@/api/service/calendar.service";

export const calendarRouter = new Elysia({ prefix: "/calendar" }).get("/", () =>
  calendarService.getCalendarReadModel()
);
