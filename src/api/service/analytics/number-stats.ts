import type { DigitEvent, PrizeLike } from "@/api/service/analytics/digit-events";
import { getNumberShapeFlags } from "@/lib/app/number-shape";
import type {
  ApiDigitStat,
  ApiNumberStat,
  ApiPatternFlag,
  ApiPatternSummary,
  ApiTrendDirection
} from "@/schema/api/analytics";

type AnalyticsContext = {
  computedAt: Date;
  drawCount: number;
  windowSize: number;
};

type DateWindowContext = {
  olderDates: Set<string>;
  olderSampleSizeByGroup: Map<string, number>;
  recentDates: Set<string>;
  recentSampleSizeByGroup: Map<string, number>;
  sortedDateKeys: string[];
  sortedTimes: number[];
};

export function calculateDigitStats(
  events: readonly DigitEvent[],
  context: AnalyticsContext
): ApiDigitStat[] {
  const groups = new Map<string, DigitEvent[]>();
  const dateWindow = buildDigitDateWindowContext(events);
  const sampleSizeByGroup = buildDigitSampleSizes(events);
  const computedAt = context.computedAt.toISOString();
  const expectedFrequencyPercent = 10;

  for (const event of events) {
    pushToGroup(groups, getDigitGroupKey(event), event);
  }

  return [...groups.values()]
    .map((group) => {
      const latestEvent = getLatestEvent(group);
      const hitCount = group.length;
      const sampleEventCount = getDigitSampleSize(group, sampleSizeByGroup);
      const frequencyPercent = getFrequencyPercent(hitCount, sampleEventCount);

      return {
        computedAt,
        digit: group[0]?.digit ?? "",
        drawCount: context.drawCount,
        expectedFrequencyPercent,
        frequencyPercent,
        hitCount,
        lastSeenDrawDate: latestEvent?.drawDate.toISOString(),
        lift: getLift(frequencyPercent, expectedFrequencyPercent),
        lotteryType: group[0]?.lotteryType ?? "",
        missingDrawCount: getMissingDrawCountFromDate(
          latestEvent?.drawDate,
          dateWindow.sortedTimes
        ),
        position: group[0]?.position,
        prizeType: group[0]?.prizeType ?? "",
        sampleEventCount,
        trendDirection: getTrendDirection(group, dateWindow),
        windowSize: context.windowSize
      };
    })
    .sort(sortDigitStats);
}

export function calculateNumberStats(
  prizes: readonly PrizeLike[],
  context: AnalyticsContext,
  numberLength?: number
): ApiNumberStat[] {
  const filteredPrizes = numberLength
    ? prizes.filter((prize) => prize.number.length === numberLength)
    : prizes;

  const groups = new Map<string, PrizeLike[]>();
  const allPrizeDrawTimes = buildPrizeDrawTimes(prizes);
  const sampleSizeByGroup = buildPrizeSampleSizes(filteredPrizes);
  const computedAt = context.computedAt.toISOString();

  for (const prize of filteredPrizes) {
    const key = [prize.draw.lotteryType, prize.type, prize.number].join("|");
    pushToGroup(groups, key, prize);
  }

  return [...groups.values()]
    .map((group) => {
      const firstPrize = group[0];
      const latestPrize = getLatestPrize(group);
      const latestDate = latestPrize ? normalizeDate(latestPrize.draw.drawDate) : undefined;
      const hitCount = group.length;
      const gaps = getGaps(group);
      const samplePrizeCount = getPrizeSampleSize(group, sampleSizeByGroup);
      const frequencyPerDrawPercent = getFrequencyPercent(hitCount, context.drawCount);
      const frequencyPerPrizeRowPercent = getFrequencyPercent(hitCount, samplePrizeCount);
      const frequencyPercent = frequencyPerPrizeRowPercent;
      const missingDrawCount = getMissingDrawCountFromDate(latestDate, allPrizeDrawTimes);

      return {
        averageGap: getAverageGapFromGaps(gaps),
        computedAt,
        drawCount: context.drawCount,
        frequencyPercent,
        frequencyPerDrawPercent,
        frequencyPerPrizeRowPercent,
        hitCount,
        lastSeenDrawDate: latestDate?.toISOString(),
        lotteryType: firstPrize?.draw.lotteryType ?? "",
        maxGap: getMaxGapFromGaps(gaps),
        missingDrawCount,
        number: firstPrize?.number ?? "",
        numberLength: firstPrize?.number.length ?? 0,
        patternFlags: getPatternFlags(firstPrize?.number ?? ""),
        prizeType: firstPrize?.type ?? "",
        samplePrizeCount,
        trendScore: getTrendScoreFromFrequency(
          frequencyPercent,
          missingDrawCount,
          context.drawCount
        ),
        windowSize: context.windowSize
      };
    })
    .sort(sortNumberStats);
}

export function summarizePatterns(
  numberStats: readonly ApiNumberStat[],
  drawCount: number
): ApiPatternSummary[] {
  const flags: ApiPatternFlag[] = [
    "odd",
    "even",
    "high",
    "low",
    "double",
    "has_repeat",
    "all_unique",
    "double_pair",
    "triple",
    "quad_or_more",
    "ascending",
    "descending",
    "ascending_run",
    "descending_run",
    "mirror",
    "palindrome",
    "balanced_odd_even",
    "balanced_high_low",
    "low_sum",
    "mid_sum",
    "high_sum"
  ];

  const hitCountByFlag = new Map<ApiPatternFlag, number>();
  const totalHits = numberStats.reduce((total, stat) => total + stat.hitCount, 0);

  for (const stat of numberStats) {
    for (const flag of stat.patternFlags) {
      hitCountByFlag.set(flag, (hitCountByFlag.get(flag) ?? 0) + stat.hitCount);
    }
  }

  return flags
    .map((flag) => {
      const hitCount = hitCountByFlag.get(flag) ?? 0;

      return {
        frequencyPercent: getFrequencyPercent(hitCount, totalHits),
        hitCount,
        id: `pattern-${flag}`,
        insight: `Found ${hitCount} of ${totalHits} prize rows with ${flag} (${drawCount} draws in window).`,
        label: flag,
        pattern: flag,
        sampleSize: totalHits
      };
    })
    .filter((summary) => summary.hitCount > 0);
}

function pushToGroup<T>(groups: Map<string, T[]>, key: string, item: T) {
  const existing = groups.get(key);

  if (existing) {
    existing.push(item);
    return;
  }

  groups.set(key, [item]);
}

function buildDigitDateWindowContext(events: readonly DigitEvent[]): DateWindowContext {
  const sortedTimes = [...new Set(events.map((event) => event.drawDate.getTime()))].sort(
    (left, right) => left - right
  );
  const sortedDateKeys = sortedTimes.map((time) => new Date(time).toISOString());
  const halfIndex = Math.floor(sortedDateKeys.length / 2);

  return {
    olderDates: new Set(sortedDateKeys.slice(0, halfIndex)),
    olderSampleSizeByGroup: buildDateRangeSampleSizes(
      events,
      new Set(sortedDateKeys.slice(0, halfIndex))
    ),
    recentDates: new Set(sortedDateKeys.slice(halfIndex)),
    recentSampleSizeByGroup: buildDateRangeSampleSizes(
      events,
      new Set(sortedDateKeys.slice(halfIndex))
    ),
    sortedDateKeys,
    sortedTimes
  };
}

function buildDigitSampleSizes(events: readonly DigitEvent[]) {
  const sampleSizeByGroup = new Map<string, number>();

  for (const event of events) {
    const key = getPositionSampleKey(event);

    sampleSizeByGroup.set(key, (sampleSizeByGroup.get(key) ?? 0) + 1);
  }

  return sampleSizeByGroup;
}

function buildDateRangeSampleSizes(events: readonly DigitEvent[], dateKeys: ReadonlySet<string>) {
  const sampleSizeByGroup = new Map<string, number>();

  for (const event of events) {
    if (!dateKeys.has(event.drawDate.toISOString())) {
      continue;
    }

    const key = getPositionSampleKey(event);

    sampleSizeByGroup.set(key, (sampleSizeByGroup.get(key) ?? 0) + 1);
  }

  return sampleSizeByGroup;
}

function getDigitSampleSize(
  group: readonly DigitEvent[],
  sampleSizeByGroup: ReadonlyMap<string, number>
) {
  const firstEvent = group[0];

  if (!firstEvent) {
    return 0;
  }

  return sampleSizeByGroup.get(getPositionSampleKey(firstEvent)) ?? group.length;
}

function buildPrizeDrawTimes(prizes: readonly PrizeLike[]) {
  return [...new Set(prizes.map((prize) => normalizeDate(prize.draw.drawDate).getTime()))].sort(
    (left, right) => left - right
  );
}

function buildPrizeSampleSizes(prizes: readonly PrizeLike[]) {
  const sampleSizeByGroup = new Map<string, number>();

  for (const prize of prizes) {
    const key = getPrizeSampleKey(prize);

    sampleSizeByGroup.set(key, (sampleSizeByGroup.get(key) ?? 0) + 1);
  }

  return sampleSizeByGroup;
}

function getPrizeSampleSize(
  group: readonly PrizeLike[],
  sampleSizeByGroup: ReadonlyMap<string, number>
) {
  const firstPrize = group[0];

  if (!firstPrize) {
    return 0;
  }

  return sampleSizeByGroup.get(getPrizeSampleKey(firstPrize)) ?? group.length;
}

function getLatestEvent(events: readonly DigitEvent[]): DigitEvent | undefined {
  let latest: DigitEvent | undefined;

  for (const event of events) {
    if (!latest || event.drawDate.getTime() > latest.drawDate.getTime()) {
      latest = event;
    }
  }

  return latest;
}

function getLatestPrize(prizes: readonly PrizeLike[]): PrizeLike | undefined {
  let latest: PrizeLike | undefined;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const prize of prizes) {
    const time = normalizeDate(prize.draw.drawDate).getTime();

    if (time > latestTime) {
      latest = prize;
      latestTime = time;
    }
  }

  return latest;
}

function getMissingDrawCountFromDate(
  latestDate: Date | undefined,
  sortedDrawTimes: readonly number[]
) {
  if (!latestDate) {
    return 0;
  }

  const latestTime = latestDate.getTime();
  let firstNewerIndex = sortedDrawTimes.length;

  for (let index = 0; index < sortedDrawTimes.length; index += 1) {
    if (sortedDrawTimes[index] > latestTime) {
      firstNewerIndex = index;
      break;
    }
  }

  return sortedDrawTimes.length - firstNewerIndex;
}

function getTrendDirection(
  group: readonly DigitEvent[],
  dateWindow: DateWindowContext
): ApiTrendDirection {
  let olderHits = 0;
  let recentHits = 0;
  const firstEvent = group[0];
  const sampleKey = firstEvent ? getPositionSampleKey(firstEvent) : "";

  for (const event of group) {
    const dateKey = event.drawDate.toISOString();

    if (dateWindow.olderDates.has(dateKey)) {
      olderHits += 1;
    }

    if (dateWindow.recentDates.has(dateKey)) {
      recentHits += 1;
    }
  }

  const olderRate = getRate(olderHits, dateWindow.olderSampleSizeByGroup.get(sampleKey) ?? 0);
  const recentRate = getRate(recentHits, dateWindow.recentSampleSizeByGroup.get(sampleKey) ?? 0);
  const minimumMeaningfulMove = 0.01;

  if (recentRate - olderRate > minimumMeaningfulMove) {
    return "up";
  }

  if (olderRate - recentRate > minimumMeaningfulMove) {
    return "down";
  }

  return "flat";
}

function getFrequencyPercent(hitCount: number, sampleSize: number) {
  return sampleSize > 0 ? round((hitCount / sampleSize) * 100) : 0;
}

function getAverageGapFromGaps(gaps: readonly number[]) {
  if (gaps.length === 0) {
    return undefined;
  }

  return round(gaps.reduce((total, gap) => total + gap, 0) / gaps.length);
}

function getMaxGapFromGaps(gaps: readonly number[]) {
  return gaps.length > 0 ? Math.max(...gaps) : undefined;
}

function getGaps(prizes: readonly PrizeLike[]) {
  const dates = [
    ...new Set(prizes.map((prize) => normalizeDate(prize.draw.drawDate).getTime()))
  ].sort((left, right) => left - right);

  return dates.slice(1).map((date, index) => {
    const previous = dates[index];
    const diffMs = date - previous;

    return Math.max(1, Math.round(diffMs / 86_400_000));
  });
}

function getTrendScoreFromFrequency(
  frequencyScore: number,
  missingDrawCount: number,
  drawCount: number
) {
  const recencyScore =
    drawCount > 0 ? clamp(100 - (missingDrawCount / Math.max(1, drawCount)) * 100) : 0;

  return round(frequencyScore * 0.65 + recencyScore * 0.35);
}

function getPatternFlags(number: string): ApiPatternFlag[] {
  return getNumberShapeFlags(number);
}

function sortDigitStats(left: ApiDigitStat, right: ApiDigitStat) {
  return (
    right.hitCount - left.hitCount ||
    left.prizeType.localeCompare(right.prizeType) ||
    (left.position ?? 0) - (right.position ?? 0) ||
    left.digit.localeCompare(right.digit)
  );
}

function sortNumberStats(left: ApiNumberStat, right: ApiNumberStat) {
  return right.trendScore - left.trendScore || right.hitCount - left.hitCount;
}

function getDigitGroupKey(event: DigitEvent) {
  return [event.lotteryType, event.prizeType, event.digit, event.position].join("|");
}

function getPositionSampleKey(event: DigitEvent) {
  return [event.lotteryType, event.prizeType, event.position].join("|");
}

function getPrizeSampleKey(prize: PrizeLike) {
  return [prize.draw.lotteryType, prize.type, prize.number.length].join("|");
}

function getRate(hitCount: number, sampleSize: number) {
  return sampleSize > 0 ? hitCount / sampleSize : 0;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, round(value)));
}

function getLift(observedPercent: number, expectedPercent: number) {
  return expectedPercent > 0 ? round(observedPercent / expectedPercent) : 0;
}

function normalizeDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
