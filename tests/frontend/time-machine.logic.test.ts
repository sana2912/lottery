import { describe, expect, test } from "bun:test";
import {
  buildHitRewardItems,
  groupDrawPrizesIntoSections,
  pickStrongestNearMissEvent
} from "@/frontend/pages/time-machine/time-machine.mappers";
import {
  initialTimeMachineState,
  timeMachineReducer
} from "@/frontend/pages/time-machine/time-machine.reducer";
import { selectShouldUseFallback } from "@/frontend/pages/time-machine/time-machine.selectors";
import type { TimeMachineSimulationResponse } from "@/schema/app/time-machine.schema";

const nearMiss = {
  cinematicCopy: "คุณพลาดรางวัลที่ 1 ไปเพียง 1 หลัก",
  digitDistance: 1,
  matchedDigits: 5,
  matchedPositions: [0, 1, 2, 3, 4],
  points: 300,
  prizeNumber: "123457",
  prizeType: "FIRST" as const,
  ticket: "123456"
};

const simulationFixture: TimeMachineSimulationResponse = {
  meta: {
    drawCount: 1,
    endDateIso: "2024-01-16T00:00:00.000Z",
    generatedAt: "2026-01-01T00:00:00.000Z",
    lotteryType: "THAI_GOVERNMENT",
    startDateIso: "1992-01-01T00:00:00.000Z",
    ticketCount: 1
  },
  summary: {
    bestNearMiss: nearMiss,
    chartScoreByYear: [{ id: "year-2024", label: "2024", value: 300 }],
    closestFirstMoment: nearMiss,
    hitCounts: {
      first: 0,
      nearFirst: 0,
      otherSixDigit: 0,
      threeDigit: 0,
      twoDigit: 0,
      total: 0
    },
    longestQuietStreak: 0,
    totalScore: 300
  },
  tickets: [{ number: "123456" }],
  timeline: [
    {
      drawDateIso: "2024-01-16T00:00:00.000Z",
      drawDateLabel: "16 มกราคม 2567",
      drawId: "draw-1",
      drawPrizes: [{ label: "รางวัลที่ 1", number: "123457", type: "FIRST" }],
      kind: "nearMiss",
      nearMiss,
      runningScore: 300,
      scoreDelta: 300,
      year: 2024
    }
  ]
};

describe("time-machine frontend logic", () => {
  test("reducer transitions setup -> running -> paused -> finished -> replay", () => {
    let state = initialTimeMachineState;

    state = timeMachineReducer(state, { type: "SIMULATION_REQUESTED" });
    expect(state.isPending).toBe(true);

    state = timeMachineReducer(state, {
      simulation: simulationFixture,
      type: "SIMULATION_SUCCEEDED"
    });
    expect(state.phase).toBe("running");

    state = timeMachineReducer(state, { type: "PAUSE" });
    expect(state.phase).toBe("paused");

    state = timeMachineReducer(state, { type: "RESUME" });
    expect(state.phase).toBe("running");

    state = timeMachineReducer(state, { type: "TICK" });
    expect(state.phase).toBe("finished");

    state = timeMachineReducer(state, { type: "REPLAY" });
    expect(state.phase).toBe("running");
    expect(state.eventIndex).toBe(0);
  });

  test("strongest near miss prefers higher matched digits", () => {
    const strongest = pickStrongestNearMissEvent([
      {
        ...nearMiss,
        matchedDigits: 4,
        ticket: "223456"
      },
      nearMiss
    ]);

    expect(strongest?.matchedDigits).toBe(5);
  });

  test("reduced-motion fallback uses static render mode", () => {
    const state = {
      ...initialTimeMachineState,
      renderMode: "scene" as const
    };

    expect(selectShouldUseFallback(state, true)).toBe(true);
    expect(selectShouldUseFallback(state, false)).toBe(false);
  });

  test("groups draw prizes into ordered sections with FIRST hero", () => {
    const sections = groupDrawPrizesIntoSections([
      { label: "เลขท้าย 2 ตัว", number: "12", type: "TWO_DIGIT" },
      { label: "รางวัลที่ 1", number: "123456", type: "FIRST" },
      { label: "รางวัลที่ 2 #1", number: "111111", position: 1, type: "PRIZE2" }
    ]);

    expect(sections.map((section) => section.type)).toEqual(["FIRST", "PRIZE2", "TWO_DIGIT"]);
    expect(sections[0]?.prominence).toBe("hero");
    expect(sections[2]?.prominence).toBe("compact");
  });

  test("buildHitRewardItems maps hits with draw context", () => {
    const event = {
      ...simulationFixture.timeline[0],
      drawPrizes: [{ label: "รางวัลที่ 2 #1", number: "204642", position: 1, type: "PRIZE2" }],
      hits: [
        {
          matchedDigits: 6,
          points: 500,
          prizeNumber: "204642",
          prizeType: "PRIZE2",
          segment: "full6" as const,
          ticket: "204642"
        }
      ],
      kind: "hit" as const
    };

    const items = buildHitRewardItems(event);

    expect(items).toHaveLength(1);
    expect(items[0]?.prizeLabel).toBe("รางวัลที่ 2 #1");
    expect(items[0]?.year).toBe(2024);
  });
});
