import { describe, expect, test } from "bun:test";
import { createAnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import { buildCalendarHeatmapInsight } from "@/api/service/calendar/calendar-heatmap-insight";

describe("buildCalendarHeatmapInsight", () => {
  test("uses prize-slot opportunities as denominator for multi-prize draws", () => {
    const context = createAnalysisContext({
      prizeType: "PRIZE5",
      scope: "ALL_TIME"
    });
    const draws = Array.from({ length: 50 }, (_, drawIndex) => ({
      draw: {
        drawDate: new Date(Date.UTC(2020, 0, 1 + drawIndex)),
        lotteryType: "THAI_GOVERNMENT" as const
      },
      drawId: `draw-${drawIndex}`,
      number: "123456",
      position: null,
      type: "PRIZE5" as const
    }));
    const prizes = draws.flatMap((draw) =>
      Array.from({ length: 100 }, (_, prizeIndex) => ({
        ...draw,
        drawId: `${draw.drawId}-${prizeIndex}`,
        number: String(prizeIndex % 10).repeat(6)
      }))
    );

    const insight = buildCalendarHeatmapInsight(context, {
      drawCount: 50,
      invalidPrizeCount: 0,
      prizes,
      prizeCount: 5000
    });

    expect(insight).not.toBeNull();
    expect(insight?.drawCount).toBe(50);
    expect(insight?.prizesPerDrawExpected).toBe(100);
    expect(insight?.prizesPerDrawActual).toBe(100);
    expect(insight?.opportunityCountPerPosition).toBe(5000);
    expect(insight?.dataCompleteness).toBe("complete");

    const firstRow = insight?.heatmapRows[0];
    const digitZero = firstRow?.cells.find((cell) => cell.digit === "0");

    expect(digitZero?.hitCount).toBe(500);
    expect(digitZero?.opportunityCount).toBe(5000);
    expect(digitZero?.hitRatePercent).toBe(10);
  });
});
