import { describe, expect, test } from "bun:test";
import { extractDigitEvents } from "@/api/service/analytics/digit-events";
import {
  calculateDigitStats,
  calculateNumberStats,
  summarizePatterns
} from "@/api/service/analytics/number-stats";

const computedAt = new Date("2026-04-28T00:00:00.000Z");
const prizes = [
  prize("2026-04-01", "09", "TWO_DIGIT"),
  prize("2026-04-16", "09", "TWO_DIGIT"),
  prize("2026-04-16", "007", "THREE_BACK"),
  prize("2026-04-01", "11", "TWO_DIGIT"),
  prize("2026-04-16", "12", "TWO_DIGIT"),
  prize("2026-04-16", "21", "TWO_DIGIT")
] as const;

describe("calculateDigitStats", () => {
  test("calculates digit frequency without dropping leading zero", () => {
    const stats = calculateDigitStats(extractDigitEvents(prizes), {
      computedAt,
      drawCount: 2,
      windowSize: 120
    });
    const zeroAtFirstPosition = stats.find(
      (stat) => stat.digit === "0" && stat.position === 1 && stat.prizeType === "TWO_DIGIT"
    );

    expect(zeroAtFirstPosition).toMatchObject({
      digit: "0",
      frequencyPercent: 100,
      hitCount: 2,
      position: 1
    });
  });

  test("returns an empty list when there are no digit events", () => {
    expect(
      calculateDigitStats([], {
        computedAt,
        drawCount: 0,
        windowSize: 120
      })
    ).toEqual([]);
  });
});

describe("calculateNumberStats", () => {
  test("keeps leading zero numbers as strings", () => {
    const stats = calculateNumberStats(prizes, {
      computedAt,
      drawCount: 2,
      windowSize: 120
    });
    const stat09 = stats.find((stat) => stat.number === "09");
    const stat007 = stats.find((stat) => stat.number === "007");

    expect(stat09).toMatchObject({
      hitCount: 2,
      number: "09",
      numberLength: 2
    });
    expect(stat007).toMatchObject({
      hitCount: 1,
      number: "007",
      numberLength: 3
    });
  });

  test("filters by requested number length", () => {
    const stats = calculateNumberStats(
      prizes,
      {
        computedAt,
        drawCount: 2,
        windowSize: 120
      },
      3
    );

    expect(stats.map((stat) => stat.number)).toEqual(["007"]);
  });

  test("keeps same number separated by prize type and returns empty list for no prizes", () => {
    const mixedStats = calculateNumberStats(
      [prize("2026-04-01", "09", "TWO_DIGIT"), prize("2026-04-16", "09", "THREE_BACK")],
      {
        computedAt,
        drawCount: 2,
        windowSize: 120
      }
    );

    expect(
      mixedStats
        .filter((stat) => stat.number === "09")
        .map((stat) => [stat.number, stat.prizeType, stat.hitCount])
    ).toEqual([
      ["09", "TWO_DIGIT", 1],
      ["09", "THREE_BACK", 1]
    ]);

    expect(
      calculateNumberStats([], {
        computedAt,
        drawCount: 0,
        windowSize: 120
      })
    ).toEqual([]);
  });

  test("assigns pattern flags for odd even high low double sequence and mirror", () => {
    const stats = calculateNumberStats(prizes, {
      computedAt,
      drawCount: 2,
      windowSize: 120
    });

    expect(stats.find((stat) => stat.number === "09")?.patternFlags).toEqual(
      expect.arrayContaining(["odd", "high", "ascending"])
    );
    expect(stats.find((stat) => stat.number === "11")?.patternFlags).toEqual(
      expect.arrayContaining(["odd", "low", "double", "mirror"])
    );
    expect(stats.find((stat) => stat.number === "12")?.patternFlags).toEqual(
      expect.arrayContaining(["even", "low", "ascending"])
    );
    expect(stats.find((stat) => stat.number === "21")?.patternFlags).toEqual(
      expect.arrayContaining(["odd", "low", "descending"])
    );
  });
});

describe("summarizePatterns", () => {
  test("summarizes non-empty pattern buckets", () => {
    const numberStats = calculateNumberStats(prizes, {
      computedAt,
      drawCount: 2,
      windowSize: 120
    });
    const summaries = summarizePatterns(numberStats, 2);

    expect(summaries.map((summary) => summary.pattern)).toEqual(
      expect.arrayContaining(["odd", "low", "double", "ascending", "descending", "mirror"])
    );
  });

  test("returns no summaries when there are no number stats", () => {
    expect(summarizePatterns([], 0)).toEqual([]);
  });
});

function prize(drawDate: string, number: string, type: string) {
  return {
    draw: {
      drawDate: new Date(`${drawDate}T00:00:00.000Z`),
      lotteryType: "THAI_GOVERNMENT"
    },
    number,
    type
  };
}
