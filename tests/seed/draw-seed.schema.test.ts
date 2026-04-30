import { describe, expect, test } from "bun:test";
import { lotteryDrawSeedFileSchema } from "@/schema/app/draw-seed.schema";

describe("draw seed schema", () => {
  test("normalizes source status and preserves leading zeroes", () => {
    const seed = lotteryDrawSeedFileSchema.parse({
      source: {
        status: "verified",
        url: "https://example.com/lottery"
      },
      draws: [
        {
          drawDate: "2026-04-16",
          prizes: [
            { number: "007", position: 1, type: "THREE_FRONT" },
            { number: "09", type: "TWO_DIGIT" }
          ]
        }
      ]
    });

    expect(seed.source?.status).toBe("VERIFIED");
    expect(seed.draws[0]?.lotteryType).toBe("THAI_GOVERNMENT");
    expect(seed.draws[0]?.prizes.map((prize) => prize.number)).toEqual(["007", "09"]);
  });

  test("rejects prize numbers with invalid length for their prize type", () => {
    expect(() =>
      lotteryDrawSeedFileSchema.parse({
        draws: [
          {
            drawDate: "2026-04-16",
            prizes: [{ number: "9", type: "TWO_DIGIT" }]
          }
        ]
      })
    ).toThrow("TWO_DIGIT prize number must be 2 digits.");
  });

  test("accepts a top-level draw array for simple scraper output", () => {
    const seed = lotteryDrawSeedFileSchema.parse([
      {
        drawDate: "2026-04-16",
        sourceStatus: "partial",
        prizes: []
      }
    ]);

    expect(seed.draws[0]?.sourceStatus).toBe("PARTIAL");
  });

  test("accepts seven-digit first prize values for older history rows", () => {
    const seed = lotteryDrawSeedFileSchema.parse({
      draws: [
        {
          drawDate: "1994-12-30",
          prizes: [{ number: "6284069", type: "FIRST" }]
        }
      ]
    });

    expect(seed.draws[0]?.prizes[0]?.number).toBe("6284069");
  });
});
