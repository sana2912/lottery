import { getNearMissCinematicCopy } from "@/api/service/time-machine/copy";
import { buildDrawPrizes } from "@/api/service/time-machine/draw-prizes";
import {
  compareTicketToPrize,
  isEligiblePrizeType,
  type SegmentComparisonResult
} from "@/api/service/time-machine/prize-comparison";
import {
  FIRST_NEAR_MISS_POINTS,
  getExactHitPoints,
  isScorableNearMiss
} from "@/api/service/time-machine/scoring";
import type {
  TimeMachineHitEvent,
  TimeMachineNearMissEvent,
  TimeMachineTimelineEvent,
  TimeMachineTimelineKind
} from "@/schema/app/time-machine.schema";

export type SimulationDraw = {
  drawDate: Date | string;
  id: string;
  prizes: readonly {
    number: string;
    position?: number;
    type: string;
  }[];
};

export type RawComparison = {
  comparison: SegmentComparisonResult;
  drawId: string;
  prizeNumber: string;
  prizeType: string;
  ticket: string;
};

export type DrawSimulationResult = {
  hits: TimeMachineHitEvent[];
  nearMissCandidates: RawComparison[];
};

export function evaluateDrawAgainstTickets(input: {
  draw: SimulationDraw;
  tickets: readonly string[];
}): DrawSimulationResult {
  const hits: TimeMachineHitEvent[] = [];
  const nearMissCandidates: RawComparison[] = [];

  for (const ticket of input.tickets) {
    for (const prize of input.draw.prizes) {
      if (!isEligiblePrizeType(prize.type)) {
        continue;
      }

      const comparison = compareTicketToPrize({
        prizeNumber: prize.number,
        prizeType: prize.type,
        ticket
      });

      if (!comparison) {
        continue;
      }

      if (comparison.isExactHit) {
        hits.push({
          matchedDigits: comparison.matchedDigits,
          points: getExactHitPoints(prize.type),
          prizeNumber: comparison.prizeSegment,
          prizeType: prize.type,
          segment: comparison.segment,
          ticket
        });
        continue;
      }

      if (
        isScorableNearMiss({
          digitDistance: comparison.digitDistance,
          prizeType: prize.type,
          segment: comparison.segment
        })
      ) {
        nearMissCandidates.push({
          comparison,
          drawId: input.draw.id,
          prizeNumber: comparison.prizeSegment,
          prizeType: prize.type,
          ticket
        });
      }
    }
  }

  return {
    hits,
    nearMissCandidates
  };
}

export function pickStrongestNearMiss(
  candidates: readonly RawComparison[]
): TimeMachineNearMissEvent | undefined {
  if (candidates.length === 0) {
    return undefined;
  }

  const sorted = [...candidates].sort(
    (left, right) => right.comparison.matchedDigits - left.comparison.matchedDigits
  );
  const best = sorted[0];

  if (!best || best.prizeType !== "FIRST") {
    return undefined;
  }

  return {
    cinematicCopy: getNearMissCinematicCopy(),
    digitDistance: best.comparison.digitDistance,
    matchedDigits: best.comparison.matchedDigits,
    matchedPositions: best.comparison.matchedPositions,
    points: FIRST_NEAR_MISS_POINTS,
    prizeNumber: best.prizeNumber,
    prizeType: "FIRST",
    ticket: best.ticket
  };
}

export function buildTimelineEvent(input: {
  draw: SimulationDraw;
  drawDateIso: string;
  drawDateLabel: string;
  hits: TimeMachineHitEvent[];
  nearMiss?: TimeMachineNearMissEvent;
  runningScore: number;
  scoreDelta: number;
}): TimeMachineTimelineEvent {
  const year = new Date(input.drawDateIso).getUTCFullYear();
  let kind: TimeMachineTimelineKind = "pass";

  if (input.hits.length > 0) {
    kind = "hit";
  } else if (input.nearMiss) {
    kind = "nearMiss";
  }

  return {
    drawDateIso: input.drawDateIso,
    drawDateLabel: input.drawDateLabel,
    drawId: input.draw.id,
    drawPrizes: buildDrawPrizes(input.draw),
    hits: input.hits.length > 0 ? input.hits : undefined,
    kind,
    nearMiss: input.hits.length > 0 ? undefined : input.nearMiss,
    runningScore: input.runningScore,
    scoreDelta: input.scoreDelta,
    year
  };
}
