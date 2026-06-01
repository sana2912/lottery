import { describe, expect, test } from "bun:test";
import {
  createSeededLotterySurvivalRng,
  generateLotterySurvivalTicketNumbers
} from "@/api/service/lottery-survival/generator";
import {
  LotterySurvivalValidationError,
  runLotterySurvivalRoundFromDraws
} from "@/api/service/lottery-survival/lottery-survival.service";
import {
  isLotterySurvivalEligibleDraw,
  type LotterySurvivalDrawRecord,
  scoreLotterySurvivalRound
} from "@/api/service/lottery-survival/scoring";

describe("lottery-survival service", () => {
  test("filters to historical draws with numeric FIRST and TWO_DIGIT prizes", () => {
    expect(isLotterySurvivalEligibleDraw(drawRecord("valid", "1123456", "56"))).toBe(true);
    expect(isLotterySurvivalEligibleDraw(drawRecord("placeholder", "xxxxxx", "xx"))).toBe(false);
  });

  test("scores duplicate tickets and pays every matching real prize", () => {
    const score = scoreLotterySurvivalRound({
      draw: drawRecord("draw-1", "123456", "56"),
      tickets: [
        { id: "generated-1-123456", number: "123456", source: "generated" },
        { id: "generated-2-123456", number: "123456", source: "generated" }
      ]
    });

    expect(score.prizeTotal).toBe((6_000_000 + 2_000) * 2);
    expect(score.winningTickets).toHaveLength(2);
    expect(score.winBreakdown.totalPrizeMoney).toBe(score.prizeTotal);
    expect(score.winBreakdown.totalGroupedWinningEntries).toBe(2);
    expect(score.winBreakdown.totalRawWinningMatches).toBe(4);
    expect(score.winBreakdown.byPrizeType).toEqual([
      expect.objectContaining({
        groupedEntryCount: 1,
        prizeType: "FIRST",
        rawMatchCount: 2,
        subtotal: 12_000_000
      }),
      expect.objectContaining({
        groupedEntryCount: 1,
        prizeType: "TWO_DIGIT",
        rawMatchCount: 2,
        subtotal: 4_000
      })
    ]);
  });

  test("normalizes 7-digit historical first prize numbers to the last 6 digits", () => {
    const score = scoreLotterySurvivalRound({
      draw: drawRecord("draw-7-digit", "1123456", "99"),
      tickets: [{ id: "generated-1-123456", number: "123456", source: "generated" }]
    });

    expect(score.winningTickets.some((hit) => hit.prizeType === "FIRST")).toBe(true);
    expect(score.prizeTotal).toBe(6_000_000);
  });

  test("rejects manual tickets when the round buys more than 20 tickets", () => {
    expect(() =>
      runLotterySurvivalRoundFromDraws({
        draws: [drawRecord("draw-1", "123456", "56")],
        input: {
          balanceBefore: 800_000,
          manualTickets: ["123456"],
          roundIndex: 1,
          strategy: "random"
        },
        rng: createSeededLotterySurvivalRng("manual-high-balance")
      })
    ).toThrow(LotterySurvivalValidationError);
  });

  test("fills missing low-balance manual tickets with generated tickets", () => {
    const round = runLotterySurvivalRoundFromDraws({
      draws: [drawRecord("draw-1", "123456", "56")],
      input: {
        balanceBefore: 1_600,
        manualTickets: ["123456"],
        roundIndex: 1,
        strategy: "random"
      },
      rng: createSeededLotterySurvivalRng("manual-fill")
    });

    expect(round.ticketCount).toBe(20);
    expect(round.manualCount).toBe(1);
    expect(round.generatedCount).toBe(19);
  });

  test("generates numbers matching a selected six-digit pattern", () => {
    const numbers = generateLotterySurvivalTicketNumbers({
      count: 25,
      patternId: "all_unique",
      rng: createSeededLotterySurvivalRng("all-unique"),
      strategy: "pattern"
    });

    expect(numbers).toHaveLength(25);
    expect(numbers.every((number) => new Set(number).size === 6)).toBe(true);
  });

  test("weighted favorite digits appear more often without locking results", () => {
    const numbers = generateLotterySurvivalTicketNumbers({
      count: 200,
      favoriteDigits: ["2", "7"],
      rng: createSeededLotterySurvivalRng("favorite-weight"),
      strategy: "favorite"
    });
    const digits = numbers.join("");
    const favoriteHits = [...digits].filter((digit) => digit === "2" || digit === "7").length;
    const uniqueNumbers = new Set(numbers).size;

    expect(favoriteHits).toBeGreaterThan(420);
    expect(uniqueNumbers).toBeGreaterThan(150);
  });

  test("ranks strongest near miss highlights first", () => {
    const score = scoreLotterySurvivalRound({
      draw: {
        ...drawRecord("draw-near", "123456", "88"),
        prizes: [
          { number: "123456", type: "FIRST" },
          { number: "56", type: "TWO_DIGIT" }
        ]
      },
      tickets: [
        { id: "generated-1-023456", number: "023456", source: "generated" },
        { id: "generated-2-000057", number: "000057", source: "generated" }
      ]
    });

    expect(score.nearMisses[0]?.category).toBe("FIRST_LAST_FIVE");
  });
});

function drawRecord(id: string, firstPrize: string, twoDigit: string): LotterySurvivalDrawRecord {
  return {
    drawDate: "1992-01-16T00:00:00.000Z",
    id,
    prizes: [
      { number: firstPrize, type: "FIRST" },
      { number: twoDigit, type: "TWO_DIGIT" }
    ],
    sourceStatus: "VERIFIED"
  };
}
