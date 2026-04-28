import { describe, expect, test } from "bun:test";
import { extractDigitEvents } from "@/api/service/analytics/digit-events";

describe("extractDigitEvents", () => {
  test("preserves leading zero digits and one-based positions", () => {
    const events = extractDigitEvents([
      {
        draw: {
          drawDate: new Date("2026-04-16T00:00:00.000Z"),
          lotteryType: "THAI_GOVERNMENT"
        },
        number: "007",
        type: "THREE_BACK"
      },
      {
        draw: {
          drawDate: new Date("2026-04-16T00:00:00.000Z"),
          lotteryType: "THAI_GOVERNMENT"
        },
        number: "09",
        type: "TWO_DIGIT"
      }
    ]);

    expect(events.map((event) => event.digit)).toEqual(["0", "0", "7", "0", "9"]);
    expect(events.map((event) => event.position)).toEqual([1, 2, 3, 1, 2]);
    expect(events.map((event) => event.number)).toEqual(["007", "007", "007", "09", "09"]);
  });
});
