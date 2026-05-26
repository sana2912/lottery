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

const SCOPES: MatrixScope[] = ["ALL_TIME", "MONTH"];
const MONTHS = [1, 5, 12] as const;

describe("analysis normalization matrix", () => {
  for (const prizeType of PRIZE_TYPES) {
    for (const scope of SCOPES) {
      const months = scope === "MONTH" ? MONTHS : [undefined];

      for (const month of months) {
        test(`${prizeType} ${scope} month=${month ?? "ALL"} full sample`, () => {
          const draws = buildSyntheticDraws({
            drawCount: 120,
            month: month ?? 1,
            prizeType
          });
          const sampleDraws = selectMatrixSampleDraws(draws, prizeType, scope, month);
          const prizes = flattenValidPrizes(sampleDraws, prizeType);

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

  test("equal relative hit density matches frequency across prize row counts", () => {
    const drawCount = 10;
    const sharedNumber = "123456";
    const twoDigitPrizes = Array.from({ length: drawCount }, (_, index) => ({
      draw: {
        drawDate: new Date(Date.UTC(2026, 0, index + 1)),
        lotteryType: "THAI_GOVERNMENT"
      },
      drawId: `draw-${index}`,
      number: sharedNumber,
      position: 1,
      type: "FIRST" as const
    }));
    const stats = calculateNumberStats(twoDigitPrizes, { computedAt: new Date(), drawCount }, 6);
    const hit = stats.find((stat) => stat.number === sharedNumber);

    expect(hit?.hitCount).toBe(drawCount);
    expect(hit?.frequencyPercent).toBe(100);
  });
});
