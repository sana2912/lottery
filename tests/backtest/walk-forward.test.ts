import { describe, expect, test } from "bun:test";
import { getBacktestSummary, runWalkForwardBacktest } from "@/api/service/backtest/walk-forward";
import { getPredictionStrategy } from "@/api/service/prediction/strategy-registry";

describe("runWalkForwardBacktest", () => {
  test("uses only prior draws, sorts by date, and never leaks target draw numbers into candidates", () => {
    const results = runWalkForwardBacktest({
      candidateCount: 2,
      draws: [
        draw("draw-3", "2026-02-01T00:00:00.000Z", "11"),
        draw("draw-1", "2026-01-01T00:00:00.000Z", "11"),
        draw("draw-4", "2026-02-16T00:00:00.000Z", "99"),
        draw("draw-2", "2026-01-16T00:00:00.000Z", "22")
      ],
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      runId: "run-1",
      strategy: getPredictionStrategy("balanced"),
      windowSize: 10
    });

    expect(results).toHaveLength(3);
    expect(results.map((result) => result.drawId)).toEqual(["draw-2", "draw-3", "draw-4"]);
    expect(results.every((result) => result.runId === "run-1")).toBe(true);

    expect(results[0]).toMatchObject({
      actualNumbers: ["22"],
      drawId: "draw-2",
      generatedNumbers: ["11"],
      hitNumbers: [],
      isHit: false,
      rankOfHit: undefined,
      runId: "run-1"
    });

    expect(results[1]).toMatchObject({
      actualNumbers: ["11"],
      drawId: "draw-3",
      generatedNumbers: ["11", "22"],
      hitNumbers: ["11"],
      isHit: true,
      rankOfHit: 1,
      runId: "run-1"
    });

    expect(results[2]).toMatchObject({
      actualNumbers: ["99"],
      drawId: "draw-4",
      generatedNumbers: ["11", "22"],
      hitNumbers: [],
      isHit: false,
      rankOfHit: undefined,
      runId: "run-1"
    });
    expect(results[2]?.generatedNumbers).not.toContain("99");
  });
});

describe("getBacktestSummary", () => {
  test("calculates hit rate, average rank, and longest miss streak", () => {
    const summary = getBacktestSummary([
      result("r1", false),
      result("r2", false),
      result("r3", true, 1),
      result("r4", false),
      result("r5", true, 2)
    ]);

    expect(summary).toEqual({
      averageHitRank: 1.5,
      hitRate: 40,
      longestMissStreak: 2
    });
  });

  test("returns safe zeroed summary for empty results", () => {
    expect(getBacktestSummary([])).toEqual({
      averageHitRank: undefined,
      hitRate: 0,
      longestMissStreak: 0
    });
  });
});

function draw(id: string, drawDate: string, number: string) {
  return {
    drawDate,
    id,
    lotteryType: "THAI_GOVERNMENT",
    prizes: [
      {
        drawId: id,
        number,
        type: "TWO_DIGIT"
      }
    ]
  };
}

function result(id: string, isHit: boolean, rankOfHit?: number) {
  return {
    actualNumbers: isHit ? ["11"] : ["22"],
    drawDate: "2026-04-16T00:00:00.000Z",
    drawId: `draw-${id}`,
    generatedNumbers: ["11", "22"],
    hitNumbers: isHit ? ["11"] : [],
    id,
    isHit,
    rankOfHit,
    runId: "run-1"
  };
}
