import type { AnalysisPrizeType } from "@/api/service/analysis-snapshot/analysis-context";

/** Expected prize rows per draw for Thai government lottery (audit catalog). */
export const EXPECTED_PRIZES_PER_DRAW = {
  FIRST: 1,
  NEAR_FIRST: 2,
  PRIZE2: 5,
  PRIZE3: 10,
  PRIZE4: 50,
  PRIZE5: 100,
  THREE_BACK: 2,
  THREE_DIGIT: null,
  THREE_FRONT: 2,
  TWO_DIGIT: 1,
  SIX_DIGIT_ALL: null
} as const satisfies Record<AnalysisPrizeType, number | null>;

export function getExpectedPrizesPerDraw(prizeType: AnalysisPrizeType): number | null {
  return EXPECTED_PRIZES_PER_DRAW[prizeType];
}

export function getPrizesPerDrawActual(drawCount: number, prizeCount: number) {
  if (drawCount <= 0) {
    return 0;
  }

  return Math.round((prizeCount / drawCount) * 100) / 100;
}

export function getCalendarDataCompleteness(input: {
  expected: number | null;
  invalidPrizeCount: number;
  prizesPerDrawActual: number;
}) {
  if (input.invalidPrizeCount > 0) {
    return "partial" as const;
  }

  if (input.expected !== null && input.prizesPerDrawActual < input.expected) {
    return "partial" as const;
  }

  return "complete" as const;
}
