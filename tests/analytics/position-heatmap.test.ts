import { describe, expect, test } from "bun:test";
import {
  assignWithinRowVisualTones,
  buildPositionHeatmapRows
} from "@/api/service/analytics/position-heatmap";

describe("buildPositionHeatmapRows", () => {
  test("assigns within-row visual tones even when absolute event rates are flat", () => {
    const [row] = buildPositionHeatmapRows(
      [
        {
          drawDate: new Date("2026-04-01T00:00:00.000Z"),
          numbers: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }
      ],
      1
    );

    expect(row?.cells).toHaveLength(10);
    expect(row?.cells.every((cell) => cell.score === 50)).toBe(true);
    expect(row?.cells.every((cell) => cell.eventRatePercent === 10)).toBe(true);
    expect(row?.cells.every((cell) => cell.expectedRatePercent === 10)).toBe(true);
    expect(row?.cells.every((cell) => cell.sampleEventCount === 10)).toBe(true);
    expect(row?.cells.some((cell) => cell.tone === "hot")).toBe(true);
    expect(row?.cells.some((cell) => cell.tone === "cold")).toBe(true);
    expect(row?.cells.every((cell) => cell.tone === "neutral")).toBe(false);
    expect(row?.hotDigits.length).toBeGreaterThan(0);
    expect(row?.coldDigits.length).toBeGreaterThan(0);
  });

  test("scores product heatmap by effect size rather than sample-size significance", () => {
    const [row] = buildPositionHeatmapRows(
      [
        {
          drawDate: new Date("2026-04-01T00:00:00.000Z"),
          numbers: [
            ...Array.from({ length: 1021 }, () => "0"),
            ...Array.from({ length: 8979 }, (_, index) => String((index % 9) + 1))
          ]
        }
      ],
      1
    );
    const zero = row?.cells.find((cell) => cell.digit === "0");

    expect(zero).toMatchObject({
      eventCount: 1021,
      eventRatePercent: 10.21,
      expectedRatePercent: 10,
      sampleEventCount: 10_000,
      score: 52.1,
      tone: "hot"
    });
  });

  test("ranks a slightly higher digit with a warmer tone in a multi-row draw", () => {
    const [row] = buildPositionHeatmapRows(
      [
        {
          drawDate: new Date("2026-04-01T00:00:00.000Z"),
          numbers: [...Array.from({ length: 9 }, () => "1"), "9"]
        }
      ],
      1
    );
    const nine = row?.cells.find((cell) => cell.digit === "9");
    const one = row?.cells.find((cell) => cell.digit === "1");

    expect(one?.eventRatePercent).toBeGreaterThan(nine?.eventRatePercent ?? 0);
    expect(one?.tone).toBeDefined();
    expect(nine?.tone).toBeDefined();
    expect(["hot", "warm"]).toContain(one?.tone as string);
    expect(["cold", "cool", "neutral", "warm"]).toContain(nine?.tone as string);
  });
});

describe("assignWithinRowVisualTones", () => {
  test("maps top and bottom ranks to hot and cold tones", () => {
    const cells = assignWithinRowVisualTones(
      Array.from({ length: 10 }, (_, digit) => ({
        appearanceCount: 1,
        digit: String(digit),
        eventCount: 10,
        eventRatePercent: 10,
        expectedRatePercent: 10,
        expectedPresenceRatePercent: 65,
        lift: 1,
        missingRounds: 0,
        presenceRatePercent: 10,
        sampleEventCount: 100,
        score: 50,
        tone: "neutral" as const
      }))
    );

    const hotCells = cells.filter((cell) => cell.tone === "hot");
    const coldCells = cells.filter((cell) => cell.tone === "cold");

    expect(hotCells).toHaveLength(2);
    expect(coldCells).toHaveLength(2);
  });
});
