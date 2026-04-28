import type { DigitEvent, PrizeLike } from "@/api/service/analytics/digit-events";
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

export function calculateDigitStats(
  events: readonly DigitEvent[],
  context: AnalyticsContext
): ApiDigitStat[] {
  const groups = new Map<string, DigitEvent[]>();

  for (const event of events) {
    const key = [event.lotteryType, event.prizeType, event.digit, event.position].join("|");
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  return [...groups.values()]
    .map((group) => {
      const latestEvent = getLatestEvent(group);
      const hitCount = group.length;

      return {
        computedAt: context.computedAt.toISOString(),
        digit: group[0]?.digit ?? "",
        drawCount: context.drawCount,
        frequencyPercent: getFrequencyPercent(hitCount, context.drawCount),
        hitCount,
        lastSeenDrawDate: latestEvent?.drawDate.toISOString(),
        lotteryType: group[0]?.lotteryType ?? "",
        missingDrawCount: getMissingDrawCount(latestEvent, events),
        position: group[0]?.position,
        prizeType: group[0]?.prizeType ?? "",
        trendDirection: getTrendDirection(group, events),
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

  for (const prize of filteredPrizes) {
    const key = [prize.draw.lotteryType, prize.type, prize.number].join("|");
    groups.set(key, [...(groups.get(key) ?? []), prize]);
  }

  return [...groups.values()]
    .map((group) => {
      const latestPrize = getLatestPrize(group);
      const hitCount = group.length;

      return {
        averageGap: getAverageGap(group),
        computedAt: context.computedAt.toISOString(),
        drawCount: context.drawCount,
        frequencyPercent: getFrequencyPercent(hitCount, context.drawCount),
        hitCount,
        lastSeenDrawDate: latestPrize
          ? normalizeDate(latestPrize.draw.drawDate).toISOString()
          : undefined,
        lotteryType: group[0]?.draw.lotteryType ?? "",
        maxGap: getMaxGap(group),
        missingDrawCount: getMissingDrawCountFromDate(
          latestPrize ? normalizeDate(latestPrize.draw.drawDate) : undefined,
          prizes
        ),
        number: group[0]?.number ?? "",
        numberLength: group[0]?.number.length ?? 0,
        patternFlags: getPatternFlags(group[0]?.number ?? ""),
        prizeType: group[0]?.type ?? "",
        trendScore: getTrendScore(hitCount, context.drawCount, group),
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
    "ascending",
    "descending",
    "mirror"
  ];

  return flags
    .map((flag) => {
      const hitCount = numberStats.filter((stat) => stat.patternFlags.includes(flag)).length;

      return {
        frequencyPercent: getFrequencyPercent(hitCount, numberStats.length),
        hitCount,
        id: `pattern-${flag}`,
        insight: `${flag} appeared in ${hitCount} tracked number groups from ${drawCount} draws.`,
        label: flag,
        pattern: flag,
        sampleSize: numberStats.length
      };
    })
    .filter((summary) => summary.hitCount > 0);
}

function getLatestEvent(events: readonly DigitEvent[]): DigitEvent | undefined {
  return [...events].sort((left, right) => right.drawDate.getTime() - left.drawDate.getTime())[0];
}

function getLatestPrize(prizes: readonly PrizeLike[]): PrizeLike | undefined {
  return [...prizes].sort(
    (left, right) =>
      normalizeDate(right.draw.drawDate).getTime() - normalizeDate(left.draw.drawDate).getTime()
  )[0];
}

function getMissingDrawCount(latestEvent: DigitEvent | undefined, events: readonly DigitEvent[]) {
  return getMissingDrawCountFromDate(latestEvent?.drawDate, events);
}

function getMissingDrawCountFromDate(
  latestDate: Date | undefined,
  records: readonly (DigitEvent | PrizeLike)[]
) {
  if (!latestDate) {
    return 0;
  }

  return new Set(
    records
      .map((record) =>
        "drawDate" in record ? record.drawDate : normalizeDate(record.draw.drawDate)
      )
      .filter((drawDate) => drawDate.getTime() > latestDate.getTime())
      .map((drawDate) => drawDate.toISOString())
  ).size;
}

function getTrendDirection(
  group: readonly DigitEvent[],
  allEvents: readonly DigitEvent[]
): ApiTrendDirection {
  const latestDates = [...new Set(allEvents.map((event) => event.drawDate.toISOString()))].sort();
  const halfIndex = Math.floor(latestDates.length / 2);
  const olderDates = new Set(latestDates.slice(0, halfIndex));
  const recentDates = new Set(latestDates.slice(halfIndex));
  const olderHits = group.filter((event) => olderDates.has(event.drawDate.toISOString())).length;
  const recentHits = group.filter((event) => recentDates.has(event.drawDate.toISOString())).length;

  if (recentHits > olderHits) {
    return "up";
  }

  if (recentHits < olderHits) {
    return "down";
  }

  return "flat";
}

function getFrequencyPercent(hitCount: number, sampleSize: number) {
  return sampleSize > 0 ? round((hitCount / sampleSize) * 100) : 0;
}

function getAverageGap(prizes: readonly PrizeLike[]) {
  const gaps = getGaps(prizes);

  if (gaps.length === 0) {
    return undefined;
  }

  return round(gaps.reduce((total, gap) => total + gap, 0) / gaps.length);
}

function getMaxGap(prizes: readonly PrizeLike[]) {
  const gaps = getGaps(prizes);

  return gaps.length > 0 ? Math.max(...gaps) : undefined;
}

function getGaps(prizes: readonly PrizeLike[]) {
  const dates = [...new Set(prizes.map((prize) => normalizeDate(prize.draw.drawDate).getTime()))]
    .sort((left, right) => left - right)
    .map((time) => new Date(time));

  return dates.slice(1).map((date, index) => {
    const previous = dates[index];
    const diffMs = date.getTime() - previous.getTime();

    return Math.max(1, Math.round(diffMs / 86_400_000));
  });
}

function getTrendScore(hitCount: number, drawCount: number, group: readonly PrizeLike[]) {
  const frequencyScore = getFrequencyPercent(hitCount, drawCount);
  const latestPrize = getLatestPrize(group);
  const recencyScore = latestPrize ? 100 : 0;

  return round(frequencyScore * 0.7 + recencyScore * 0.3);
}

function getPatternFlags(number: string): ApiPatternFlag[] {
  const digits = [...number].map(Number);
  const flags: ApiPatternFlag[] = [];
  const lastDigit = digits.at(-1);

  if (lastDigit !== undefined) {
    flags.push(lastDigit % 2 === 0 ? "even" : "odd");
    flags.push(lastDigit >= 5 ? "high" : "low");
  }

  if (new Set(digits).size === 1 && digits.length > 1) {
    flags.push("double");
  }

  if (
    digits.length > 1 &&
    digits.every((digit, index) => index === 0 || digit > digits[index - 1])
  ) {
    flags.push("ascending");
  }

  if (
    digits.length > 1 &&
    digits.every((digit, index) => index === 0 || digit < digits[index - 1])
  ) {
    flags.push("descending");
  }

  if (digits.length > 1 && number === [...number].reverse().join("")) {
    flags.push("mirror");
  }

  return flags;
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

function normalizeDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
