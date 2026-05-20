import { describe, expect, test } from "bun:test";
import { buildPositionHeatmapRows } from "@/api/service/analytics/position-heatmap";

describe("buildPositionHeatmapRows", () => {
  test("scores multi-row draws against digit event baseline instead of max raw appearances", () => {
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
    expect(row?.cells.every((cell) => cell.tone === "neutral")).toBe(true);
  });
});
