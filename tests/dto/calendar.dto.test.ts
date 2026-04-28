import { describe, expect, test } from "bun:test";
import {
  toApiCalendarDraw,
  toApiCalendarReadModel,
  toApiMonthlyInsight
} from "@/api/model/dto/calendar.dto";
import { calendarReadModelSchema } from "@/schema/app/calendar.schema";

describe("calendar.dto", () => {
  test("normalizes dates, copies arrays, and strips unknown fields", () => {
    const draw = toApiCalendarDraw({
      drawDate: "16 April 2026",
      drawDateIso: new Date("2026-04-16T00:00:00.000Z"),
      drawNo: "08/2026",
      hidden: "skip",
      id: "draw-1",
      isNextDraw: true,
      status: "upcoming"
    } as never);

    expect(draw.drawDateIso).toBe("2026-04-16T00:00:00.000Z");
    expect(draw).not.toHaveProperty("hidden");

    const insightInput = {
      coldNumbers: ["01", "02"],
      hotNumbers: ["09", "12"],
      id: "month-4",
      label: "April",
      month: 4,
      patternNotes: ["Odd endings appeared slightly more often."],
      sampleSize: 8,
      summary: "April sample leans toward odd-ending numbers."
    };
    const insight = toApiMonthlyInsight({ ...insightInput, hidden: "skip" } as never);

    expect(insight.hotNumbers).toEqual(["09", "12"]);
    expect(insight.coldNumbers).toEqual(["01", "02"]);
    expect(insight.patternNotes).toEqual(["Odd endings appeared slightly more often."]);
    expect(insight.hotNumbers).not.toBe(insightInput.hotNumbers);
    expect(insight.coldNumbers).not.toBe(insightInput.coldNumbers);
    expect(insight.patternNotes).not.toBe(insightInput.patternNotes);
    expect(insight).not.toHaveProperty("hidden");

    const model = toApiCalendarReadModel({
      draws: [draw],
      generatedAt: new Date("2026-04-29T00:00:00.000Z"),
      monthlyInsights: [insight],
      nextDraw: draw,
      source: "api"
    });

    expect(calendarReadModelSchema.parse(model)).toEqual(model);
  });
});
