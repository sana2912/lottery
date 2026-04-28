import type { CalendarReadModel } from "@/schema/app/calendar.schema";

export function getDaysUntilNextDraw(calendar: CalendarReadModel, now = new Date()) {
  const nextDrawDate = new Date(calendar.nextDraw.drawDateIso);

  return Math.max(0, Math.ceil((nextDrawDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}
