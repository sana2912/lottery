import { describe, expect, test } from "bun:test";
import {
  evaluateDrawAgainstTickets,
  pickStrongestNearMiss
} from "@/api/service/time-machine/near-miss";
import { compareTicketToPrize } from "@/api/service/time-machine/prize-comparison";
import { isScorableNearMiss } from "@/api/service/time-machine/scoring";
import { buildSimulationTimeline } from "@/api/service/time-machine/timeline";
import { simulationFixtureDraws } from "./fixtures/simulation-draws";

describe("time-machine near miss comparison", () => {
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
  });

  test("TWO_DIGIT distance 1 is not a scorable near miss", () => {
    expect(
      isScorableNearMiss({
        digitDistance: 1,
        prizeType: "TWO_DIGIT",
        segment: "last2"
      })
    ).toBe(false);
  });

  test("exact hit suppresses near-miss on the draw", () => {
    const timeline = buildSimulationTimeline({
      draws: [
        {
          drawDate: "2024-01-16T00:00:00.000Z",
          id: "draw-hit",
          prizes: [{ number: "123456", type: "FIRST" }]
        }
      ],
      tickets: ["123456"]
    });

    expect(timeline[0]?.kind).toBe("hit");
    expect(timeline[0]?.nearMiss).toBeUndefined();
    expect(timeline[0]?.drawPrizes.length).toBe(1);
  });

  test("near miss only applies to FIRST distance 1", () => {
    const drawResult = evaluateDrawAgainstTickets({
      draw: {
        drawDate: "2024-01-16T00:00:00.000Z",
        id: "draw-miss",
        prizes: [
          { number: "123457", type: "FIRST" },
          { number: "57", type: "TWO_DIGIT" }
        ]
      },
      tickets: ["123456"]
    });
    const strongest = pickStrongestNearMiss(drawResult.nearMissCandidates);

    expect(strongest?.prizeType).toBe("FIRST");
    expect(strongest?.points).toBe(300);
    expect(drawResult.nearMissCandidates.every((item) => item.prizeType === "FIRST")).toBe(true);
  });

  test("fixture timeline includes hit and FIRST near-miss summaries", () => {
    const hitTimeline = buildSimulationTimeline({
      draws: simulationFixtureDraws,
      tickets: ["123456"]
    });
    const nearMissTimeline = buildSimulationTimeline({
      draws: simulationFixtureDraws,
      tickets: ["999998"]
    });

    expect(hitTimeline.some((event) => event.kind === "hit")).toBe(true);
    expect(nearMissTimeline.some((event) => event.kind === "nearMiss")).toBe(true);
    expect(hitTimeline[0]?.drawPrizes.length).toBeGreaterThan(0);
  });
});
