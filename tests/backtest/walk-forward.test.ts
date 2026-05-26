import { describe, expect, test } from "bun:test";
import { extractDigitEvents } from "@/api/service/analytics/digit-events";
import { calculateDigitStats } from "@/api/service/analytics/number-stats";
import { getBacktestSummary, runWalkForwardBacktest } from "@/api/service/backtest/walk-forward";
import { buildPositionPredictionResults } from "@/api/service/prediction/position-engine";
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
      hitNumbers: [],
      isHit: false,
      rankOfHit: undefined,
      runId: "run-1"
    });
    expect(results[0]?.generatedNumbers).toHaveLength(2);
    expect(results[0]?.generatedNumbers).not.toContain("22");

    expect(results[1]?.drawId).toBe("draw-3");
    expect(results[1]?.actualNumbers).toEqual(["11"]);
    expect(results[1]?.runId).toBe("run-1");

    expect(results[2]).toMatchObject({
      actualNumbers: ["99"],
      drawId: "draw-4",
      runId: "run-1"
    });
    expect(results[2]?.generatedNumbers).not.toContain("99");
    expect(
      results.every(
        (result) => new Set(result.generatedNumbers).size === result.generatedNumbers.length
      )
    ).toBe(true);
  });

  test("separates calculation window from evaluated target draw count", () => {
    const results = runWalkForwardBacktest({
      candidateCount: 1,
      draws: [
        draw("draw-1", "2026-01-01T00:00:00.000Z", "11"),
        draw("draw-2", "2026-01-16T00:00:00.000Z", "22"),
        draw("draw-3", "2026-02-01T00:00:00.000Z", "33"),
        draw("draw-4", "2026-02-16T00:00:00.000Z", "44"),
        draw("draw-5", "2026-03-01T00:00:00.000Z", "55")
      ],
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      runId: "run-1",
      strategy: getPredictionStrategy("balanced"),
      targetDrawCount: 4,
      windowSize: 2
    });

    expect(results).toHaveLength(4);
    expect(results.map((result) => result.drawId)).toEqual([
      "draw-2",
      "draw-3",
      "draw-4",
      "draw-5"
    ]);
    expect(results[3]?.generatedNumbers).not.toContain("22");
  });

  test("adds hit explanation payload only when a generated candidate actually hits", () => {
    const strategy = getPredictionStrategy("balanced");
    const historyDraws = [
      draw("draw-1", "2026-01-01T00:00:00.000Z", "11"),
      draw("draw-2", "2026-01-16T00:00:00.000Z", "22")
    ];
    const targetDrawDate = "2026-02-01T00:00:00.000Z";
    const historyPrizes = historyDraws.flatMap(withDrawContext);
    const drawCount = new Set(historyPrizes.map((prize) => prize.drawId)).size;
    const digitStats = calculateDigitStats(extractDigitEvents(historyPrizes), {
      computedAt: new Date(targetDrawDate),
      drawCount
    });
    const expectedNumber = buildPositionPredictionResults({
      count: 2,
      digitStats,
      inputWindow: 10,
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategy
    })[0]?.number;

    const results = runWalkForwardBacktest({
      candidateCount: 2,
      draws: [...historyDraws, draw("draw-3", targetDrawDate, expectedNumber ?? "11")],
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      runId: "run-1",
      strategy,
      targetDrawCount: 1,
      windowSize: 10
    });

    expect(results[0]?.isHit).toBe(true);
    expect(results[0]?.explanation).toMatchObject({
      calculationWindow: 10,
      candidateCount: 2,
      strategyId: "balanced",
      strategyName: "Balanced",
      version: "prediction-engine-v1"
    });
    expect(results[0]?.explanation?.generatedCandidates).toHaveLength(2);
    expect(
      results[0]?.explanation?.generatedCandidates.find((candidate) => candidate.isHit)
    ).toMatchObject({
      number: expectedNumber,
      rank: 1
    });
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
      expectedRandomHitRate: 2,
      hitRate: 40,
      liftVsRandom: 38,
      longestMissStreak: 2
    });
  });

  test("returns safe zeroed summary for empty results", () => {
    expect(getBacktestSummary([])).toEqual({
      averageHitRank: undefined,
      expectedRandomHitRate: 0,
      hitRate: 0,
      liftVsRandom: 0,
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

type DrawFixture = ReturnType<typeof draw>;

function withDrawContext(draw: DrawFixture) {
  return draw.prizes.map((prize: DrawFixture["prizes"][number]) => ({
    ...prize,
    draw: {
      drawDate: draw.drawDate,
      lotteryType: draw.lotteryType
    }
  }));
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
