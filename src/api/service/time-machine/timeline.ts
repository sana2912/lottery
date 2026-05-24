import {
  buildTimelineEvent,
  evaluateDrawAgainstTickets,
  pickStrongestNearMiss,
  type SimulationDraw
} from "@/api/service/time-machine/near-miss";
import type { TimeMachineTimelineEvent } from "@/schema/app/time-machine.schema";

export function formatSimulationDrawDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long"
  }).format(date);
}

export function normalizeSimulationDrawDateIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  return date.toISOString();
}

export function buildSimulationTimeline(input: {
  draws: readonly SimulationDraw[];
  tickets: readonly string[];
}): TimeMachineTimelineEvent[] {
  const timeline: TimeMachineTimelineEvent[] = [];
  let runningScore = 0;

  for (const draw of input.draws) {
    const result = evaluateDrawAgainstTickets({
      draw,
      tickets: input.tickets
    });
    const drawDateIso = normalizeSimulationDrawDateIso(draw.drawDate);
    const drawDateLabel = formatSimulationDrawDate(draw.drawDate);
    const hitPoints = result.hits.reduce((sum, hit) => sum + hit.points, 0);
    const nearMiss =
      result.hits.length === 0 ? pickStrongestNearMiss(result.nearMissCandidates) : undefined;
    const nearMissPoints = nearMiss?.points ?? 0;
    const scoreDelta = hitPoints + nearMissPoints;

    runningScore += scoreDelta;

    timeline.push(
      buildTimelineEvent({
        draw,
        drawDateIso,
        drawDateLabel,
        hits: result.hits,
        nearMiss,
        runningScore,
        scoreDelta
      })
    );
  }

  return timeline;
}
