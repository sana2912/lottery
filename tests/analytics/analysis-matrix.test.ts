import { describe, expect, test } from "bun:test";
import { calculateNumberStats } from "@/api/service/analytics/number-stats";
import {
  assertDigitStatsDenominator,
  assertHeatmapEventInvariant,
  assertNumberStatsDenominator,
  buildSyntheticDraws,
  flattenValidPrizes,
  getExpectedRowsPerDraw,
  type MatrixPrizeType,
  type MatrixScope,
  type MatrixWindowPreset,
  selectMatrixSampleDraws
} from "./fixtures/analysis-matrix";

const PRIZE_TYPES: MatrixPrizeType[] = [
  "FIRST",
  "NEAR_FIRST",
  "TWO_DIGIT",
  "THREE_DIGIT",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "SIX_DIGIT_ALL"
];

const WINDOW_PRESETS: MatrixWindowPreset[] = ["50", "100", "500", "ALL"];
const SCOPES: MatrixScope[] = ["ALL_TIME", "MONTH"];
const MONTHS = [1, 5, 12] as const;

describe("analysis normalization matrix", () => {
  for (const prizeType of PRIZE_TYPES) {
    for (const windowPreset of WINDOW_PRESETS) {
      for (const scope of SCOPES) {
        const months = scope === "MONTH" ? MONTHS : [undefined];

        for (const month of months) {
          test(`${prizeType} ${scope} month=${month ?? "ALL"} window=${windowPreset}`, () => {
            const totalDraws = windowPreset === "ALL" ? 120 : Number(windowPreset) + 20;
            const draws = buildSyntheticDraws({
              drawCount: totalDraws,
              month: month ?? 1,
              prizeType
            });
            const sampleDraws = selectMatrixSampleDraws(
              draws,
              prizeType,
              scope,
              windowPreset,
              month
            );
            const prizes = flattenValidPrizes(sampleDraws, prizeType);
            const expectedDrawLimit =
              windowPreset === "ALL" ? sampleDraws.length : Number(windowPreset);

            expect(sampleDraws.length).toBeLessThanOrEqual(expectedDrawLimit);
            expect(prizes.length).toBe(sampleDraws.length * getExpectedRowsPerDraw(prizeType));

            assertNumberStatsDenominator(
              prizes,
              sampleDraws.length,
              prizeType === "TWO_DIGIT" ? 2 : prizeType === "THREE_DIGIT" ? 3 : 6
            );
            assertDigitStatsDenominator(prizes, sampleDraws.length);
            assertHeatmapEventInvariant(sampleDraws, prizeType);
          });
        }
      }
    }
  }

  test("equal relative hit density matches frequency across prize row counts", () => {
    const drawCount = 10;
    const sharedNumber = "123456";
    const twoDigitPrizes = Array.from({ length: drawCount }, (_, index) => ({
      draw: {
        drawDate: new Date(Date.UTC(2026, 0, index + 1)),
        lotteryType: "THAI_GOVERNMENT"
      },
      number: index === 0 ? "09" : "12",
      type: "TWO_DIGIT"
    }));
    const prize5Prizes = Array.from({ length: drawCount * 100 }, (_, index) => {
      const drawIndex = Math.floor(index / 100);

      return {
        draw: {
          drawDate: new Date(Date.UTC(2026, 0, drawIndex + 1)),
          lotteryType: "THAI_GOVERNMENT"
        },
        number: index % 10 === 0 ? sharedNumber : "000000",
        type: "PRIZE5"
      };
    });
    const ctx = {
      computedAt: new Date("2026-05-01T00:00:00.000Z"),
      drawCount,
      windowSize: drawCount
    };
    const twoDigitStat = calculateNumberStats(twoDigitPrizes, ctx, 2).find(
      (stat) => stat.number === "09"
    );
    const prize5Stat = calculateNumberStats(prize5Prizes, ctx, 6).find(
      (stat) => stat.number === sharedNumber
    );

    expect(twoDigitStat?.frequencyPercent).toBe(10);
    expect(prize5Stat?.frequencyPercent).toBe(10);
  });
});
