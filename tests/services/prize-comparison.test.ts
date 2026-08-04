import { describe, expect, test } from "bun:test";
import {
  compareTicketToPrize,
  extractTicketSegment,
  normalizePrizeNumber
} from "@/api/service/lottery/prize-comparison";

describe("lottery prize comparison", () => {
  test("matches last 2 digits for TWO_DIGIT prizes as exact hit", () => {
    const comparison = compareTicketToPrize({
      prizeNumber: "56",
      prizeType: "TWO_DIGIT",
      ticket: "123456"
    });

    expect(comparison).toBeDefined();
    expect(comparison?.segment).toBe("last2");
    expect(comparison?.isExactHit).toBe(true);
    expect(comparison?.matchedDigits).toBe(2);
    expect(comparison?.matchedPositions).toEqual([4, 5]);
  });

  test("uses front and back ticket segments for 3 digit prizes", () => {
    expect(extractTicketSegment("123456", "front3")).toBe("123");
    expect(extractTicketSegment("123456", "back3")).toBe("456");
  });

  test("normalizes prize numbers to the comparison length", () => {
    expect(normalizePrizeNumber("A56", 3)).toBe("056");
    expect(normalizePrizeNumber("123456", 2)).toBe("56");
  });
});
