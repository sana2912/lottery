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
      heatmapRows: [
        {
          cells: [
            {
              appearanceCount: 8,
              digit: "0",
              missingRounds: 0,
              score: 90,
              tone: "hot" as const
            }
          ],
          coldDigits: ["9"],
          hotDigits: ["0"],
          position: 1
        }
      ],
      hotNumbers: ["09", "12"],
      id: "month-4",
      label: "April",
      month: 4,
      patternNotes: ["Odd endings appeared slightly more often."],
      prizeType: "FIRST",
      positionInsights: [
        {
          coldNumbers: [
            { appearanceCount: 1, digit: "03", missingRounds: 6 },
            { appearanceCount: 2, digit: "04", missingRounds: 4 }
          ],
          hotNumbers: [
            { appearanceCount: 8, digit: "07", missingRounds: 0 },
            { appearanceCount: 7, digit: "08", missingRounds: 1 }
          ],
          position: 1
        }
      ],
      sampleSize: 8,
      summary: "April sample leans toward odd-ending numbers."
    };
    const insight = toApiMonthlyInsight({ ...insightInput, hidden: "skip" } as never);

    expect(insight.hotNumbers).toEqual(["09", "12"]);
    expect(insight.coldNumbers).toEqual(["01", "02"]);
    expect(insight.positionInsights).toEqual([
      {
        coldNumbers: [
          { appearanceCount: 1, digit: "03", missingRounds: 6 },
          { appearanceCount: 2, digit: "04", missingRounds: 4 }
        ],
        hotNumbers: [
          { appearanceCount: 8, digit: "07", missingRounds: 0 },
          { appearanceCount: 7, digit: "08", missingRounds: 1 }
        ],
        position: 1
      }
    ]);
    expect(insight.heatmapRows).toEqual(insightInput.heatmapRows);
    expect(insight.patternNotes).toEqual(["Odd endings appeared slightly more often."]);
    expect(insight.hotNumbers).not.toBe(insightInput.hotNumbers);
    expect(insight.coldNumbers).not.toBe(insightInput.coldNumbers);
    expect(insight.heatmapRows).not.toBe(insightInput.heatmapRows);
    expect(insight.positionInsights).not.toBe(insightInput.positionInsights);
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
