import type {
  TimeMachineChartPoint,
  TimeMachineHitCounts,
  TimeMachineNearMissEvent,
  TimeMachineSummary,
  TimeMachineTimelineEvent
} from "@/schema/app/time-machine.schema";

export function buildSimulationSummary(
  timeline: readonly TimeMachineTimelineEvent[]
): TimeMachineSummary {
  const hitCounts = countHits(timeline);
  const allNearMisses = timeline
    .map((event) => event.nearMiss)
    .filter((event): event is TimeMachineNearMissEvent => event !== undefined);
  const bestNearMiss = pickBestNearMiss(allNearMisses);
  const closestFirstMoment = allNearMisses[0];
  const longestQuietStreak = getLongestQuietStreak(timeline);
  const totalScore = timeline.at(-1)?.runningScore ?? 0;

  return {
    bestNearMiss,
    chartScoreByYear: buildScoreByYearChart(timeline),
    closestFirstMoment,
    hitCounts,
    longestQuietStreak,
    totalScore
  };
}

function countHits(timeline: readonly TimeMachineTimelineEvent[]): TimeMachineHitCounts {
  const counts: TimeMachineHitCounts = {
    first: 0,
    nearFirst: 0,
    otherSixDigit: 0,
    threeDigit: 0,
    twoDigit: 0,
    total: 0
  };

  for (const event of timeline) {
    for (const hit of event.hits ?? []) {
      counts.total += 1;

      switch (hit.prizeType) {
        case "FIRST":
          counts.first += 1;
          break;
        case "NEAR_FIRST":
          counts.nearFirst += 1;
          break;
        case "PRIZE2":
        case "PRIZE3":
        case "PRIZE4":
        case "PRIZE5":
          counts.otherSixDigit += 1;
          break;
        case "THREE_FRONT":
        case "THREE_BACK":
        case "THREE_DIGIT":
          counts.threeDigit += 1;
          break;
        case "TWO_DIGIT":
          counts.twoDigit += 1;
          break;
      }
    }
  }

  return counts;
}

function pickBestNearMiss(
  nearMisses: readonly TimeMachineNearMissEvent[]
): TimeMachineNearMissEvent | undefined {
  if (nearMisses.length === 0) {
    return undefined;
  }

  return [...nearMisses].sort((left, right) => right.matchedDigits - left.matchedDigits)[0];
}

function getLongestQuietStreak(timeline: readonly TimeMachineTimelineEvent[]): number {
  let longest = 0;
  let current = 0;

  for (const event of timeline) {
    const isQuiet = event.kind === "pass";

    if (isQuiet) {
      current += 1;
      longest = Math.max(longest, current);
      continue;
    }

    current = 0;
  }

  return longest;
}

function buildScoreByYearChart(
  timeline: readonly TimeMachineTimelineEvent[]
): TimeMachineChartPoint[] {
  const byYear = new Map<number, number>();

  for (const event of timeline) {
    byYear.set(event.year, (byYear.get(event.year) ?? 0) + event.scoreDelta);
  }

  return [...byYear.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([year, value]) => ({
      id: `year-${year}`,
      label: String(year),
      value
    }));
}
