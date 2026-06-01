import { describe, expect, test } from "bun:test";
import {
  buildLotterySurvivalPayload,
  buildLotterySurvivalSummary,
  getAffordableTicketCount,
  parseManualTickets
} from "@/frontend/pages/lottery-survival/lottery-survival.mappers";
import {
  initialLotterySurvivalState,
  lotterySurvivalReducer
} from "@/frontend/pages/lottery-survival/lottery-survival.reducer";
import type { LotterySurvivalRoundResponse } from "@/schema/app/lottery-survival.schema";

describe("lottery-survival frontend logic", () => {
  test("computes affordable ticket counts from balance", () => {
    expect(getAffordableTicketCount(800_000)).toBe(10_000);
    expect(getAffordableTicketCount(79)).toBe(0);
  });

  test("parses manual ticket drafts and keeps leading zeroes", () => {
    const parsed = parseManualTickets("000123, 445566\nbad 123");

    expect(parsed.tickets).toEqual(["000123", "445566"]);
    expect(parsed.invalidTickets).toEqual(["bad", "123"]);
  });

  test("builds payload that lets generated tickets fill missing manual slots", () => {
    const payload = buildLotterySurvivalPayload({
      balance: 1_600,
      favoriteDigits: ["2", "7"],
      manualTicketDraft: "000123 445566",
      patternId: "all_unique",
      roundIndex: 3,
      strategy: "patternFavorite"
    });

    expect(payload).toMatchObject({
      balanceBefore: 1_600,
      favoriteDigits: ["2", "7"],
      manualTickets: ["000123", "445566"],
      patternId: "all_unique",
      roundIndex: 3,
      strategy: "patternFavorite"
    });
  });

  test("reducer ends the game when balance drops below ticket price", () => {
    const state = lotterySurvivalReducer(initialLotterySurvivalState, {
      round: roundFixture({ balanceAfter: 40, prizeTotal: 0, roundIndex: 1 }),
      type: "ROUND_SUCCEEDED"
    });

    expect(state.phase).toBe("ended");
    expect(state.endedBy).toBe("bankrupt");
    expect(state.summary?.finalBalance).toBe(40);
  });

  test("summary picks best, worst, and closest near miss", () => {
    const history = [
      roundFixture({ balanceAfter: 720_000, prizeTotal: 0, roundIndex: 1 }),
      roundFixture({ balanceAfter: 1_000_000, prizeTotal: 400_000, roundIndex: 2 }),
      roundFixture({ balanceAfter: 900_000, prizeTotal: 0, roundIndex: 3, withNearMiss: true })
    ];
    const summary = buildLotterySurvivalSummary({
      finalBalance: 900_000,
      history
    });

    expect(summary.bestRound?.roundIndex).toBe(2);
    expect(summary.worstRound?.roundIndex).toBe(1);
    expect(summary.closestNearMiss?.category).toBe("FIRST_ONE_DIGIT");
  });
});

function roundFixture(input: {
  balanceAfter: number;
  prizeTotal: number;
  roundIndex: number;
  withNearMiss?: boolean;
}): LotterySurvivalRoundResponse {
  return {
    balanceAfter: input.balanceAfter,
    balanceBefore: 800_000,
    carryOver: 0,
    draw: {
      drawDateIso: "2026-04-16T00:00:00.000Z",
      drawDateLabel: "16 เมษายน 2569",
      id: `draw-${input.roundIndex}`,
      prizes: [{ label: "รางวัลที่ 1", number: "123456", type: "FIRST" }],
      sourceStatus: "VERIFIED"
    },
    generatedCount: 10_000,
    lotteryType: "THAI_GOVERNMENT",
    manualCount: 0,
    narratorMessage: "ท่านยังมีชีวิตรอดอีกหนึ่งงวด",
    nearMisses: input.withNearMiss
      ? [
          {
            category: "FIRST_ONE_DIGIT",
            description: "เลข 123455 พลาดรางวัลที่ 1 123456 เพียง 1 หลัก",
            digitDistance: 1,
            id: "near-1",
            label: "พลาดรางวัลที่ 1 เพียง 1 หลัก",
            matchedDigits: 5,
            matchedPositions: [0, 1, 2, 3, 4],
            prizeNumber: "123456",
            prizeType: "FIRST",
            quantity: 1,
            severity: 100,
            ticket: "123455"
          }
        ]
      : [],
    prizeTotal: input.prizeTotal,
    purchaseCost: 800_000,
    roundIndex: input.roundIndex,
    ticketCount: 10_000,
    ticketPreview: {
      items: [],
      page: 1,
      pageSize: 48,
      total: 10_000
    },
    winBreakdown: {
      byPrizeType: [],
      totalGroupedWinningEntries: 0,
      totalPrizeMoney: input.prizeTotal,
      totalRawWinningMatches: 0
    },
    winningTickets: []
  };
}
