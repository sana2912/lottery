import type { AnalyticsReadModel, DigitStat, NumberStat } from "@/schema/app/analytics.schema";
import type { FilterContext } from "@/schema/app/query.schema";

export const analyticsPrizeOptions = [
  { label: "เลขท้าย 2 ตัว", numberLength: 2, value: "TWO_DIGIT" },
  { label: "เลขหน้า 3 ตัว", numberLength: 3, value: "THREE_FRONT" },
  { label: "เลขท้าย 3 ตัว", numberLength: 3, value: "THREE_BACK" },
  { label: "รางวัลที่ 1", numberLength: 6, value: "FIRST" },
  { label: "ข้างเคียงรางวัลที่ 1", numberLength: 6, value: "NEAR_FIRST" },
  { label: "รางวัลที่ 2", numberLength: 6, value: "PRIZE2" },
  { label: "รางวัลที่ 3", numberLength: 6, value: "PRIZE3" },
  { label: "รางวัลที่ 4", numberLength: 6, value: "PRIZE4" },
  { label: "รางวัลที่ 5", numberLength: 6, value: "PRIZE5" }
] as const;

export const analyticsWindowOptions = [30, 60, 120] as const;

export type AnalyticsNumberLength = 2 | 3 | 6;

export type AnalyticsViewModel = {
  context: {
    numberLength: AnalyticsNumberLength;
    numberLengthLabel: string;
    prizeLabel: string;
    prizeType: string;
    sampleSize: number;
    windowSize: number;
  };
  digitPositions: Array<{
    digit: string;
    hitCount: number;
    id: string;
    label: string;
    positionLabel: string;
    trendDirection: DigitStat["trendDirection"];
  }>;
  exactNumbers: NumberStat[];
  overallDigits: Array<{
    digit: string;
    hitCount: number;
    sharePercent: number;
  }>;
  recentExamples: Array<{
    dna: string;
    flags: string[];
    number: string;
    prizeType: string;
  }>;
  shapeSummary: Array<{
    count: number;
    id: string;
    label: string;
    sampleSize: number;
  }>;
  signalCards: Array<{
    hint: string;
    label: string;
    tone: "cold" | "hot" | "overdue";
    value: string;
  }>;
  topRepeatedNumbers: NumberStat[];
};

export function buildAnalyticsViewModel(
  analytics: AnalyticsReadModel,
  query: FilterContext
): AnalyticsViewModel {
  const numberLength = getNumberLength(query);
  const filteredNumbers = analytics.numberStats.filter(
    (stat) => stat.number.length === numberLength
  );
  const filteredDigits = analytics.digitStats.filter(
    (stat) => stat.prizeType === query.prizeType || !query.prizeType
  );

  return {
    context: {
      numberLength,
      numberLengthLabel: `${numberLength} digits`,
      prizeLabel: getPrizeLabel(query.prizeType),
      prizeType: query.prizeType ?? "TWO_DIGIT",
      sampleSize: analytics.summary.drawCount,
      windowSize: query.windowSize
    },
    digitPositions: getPositionDigitStats(filteredDigits, query.prizeType, numberLength),
    exactNumbers: filteredNumbers.slice(0, numberLength === 6 ? 10 : 12),
    overallDigits: getOverallDigitDistribution(filteredDigits),
    recentExamples: filteredNumbers.slice(0, 12).map(toRecentExample),
    shapeSummary: getShapeSummary(filteredNumbers, numberLength),
    signalCards: getSignalCards(filteredNumbers),
    topRepeatedNumbers: filteredNumbers.filter((stat) => stat.hitCount > 1).slice(0, 10)
  };
}

export function getTopDigits(analytics: AnalyticsReadModel) {
  return analytics.digitStats.slice(0, 10);
}

export function getTopNumbers(analytics: AnalyticsReadModel) {
  return analytics.numberStats.slice(0, 8);
}

export function toDigitHeatmapCells(analytics: AnalyticsReadModel) {
  return getTopDigits(analytics).map((stat) => ({
    id: `${stat.prizeType}-${stat.position}-${stat.digit}`,
    label: stat.digit,
    value: stat.hitCount
  }));
}

export function toNumberFrequencyPoints(analytics: AnalyticsReadModel) {
  return getTopNumbers(analytics).map((stat) => ({
    id: `${stat.prizeType}-${stat.number}`,
    label: stat.number,
    value: Math.min(stat.frequencyPercent, 100)
  }));
}

export function buildAnalyticsHrefQuery(
  prizeType: string,
  numberLength: AnalyticsNumberLength
): Partial<FilterContext> {
  return {
    numberLength,
    page: 1,
    prizeType: prizeType as FilterContext["prizeType"]
  };
}

export function getPrizeLabel(prizeType: FilterContext["prizeType"]) {
  return (
    analyticsPrizeOptions.find((option) => option.value === prizeType)?.label ??
    analyticsPrizeOptions[0].label
  );
}

function getNumberLength(query: FilterContext): AnalyticsNumberLength {
  if (query.numberLength === 2 || query.numberLength === 3 || query.numberLength === 6) {
    return query.numberLength;
  }

  return getPrizeNumberLength(query.prizeType);
}

function getPrizeNumberLength(prizeType: FilterContext["prizeType"]): AnalyticsNumberLength {
  switch (prizeType) {
    case "THREE_DIGIT":
    case "THREE_FRONT":
    case "THREE_BACK":
      return 3;
    case "FIRST":
    case "NEAR_FIRST":
    case "PRIZE2":
    case "PRIZE3":
    case "PRIZE4":
    case "PRIZE5":
      return 6;
    default:
      return 2;
  }
}

function getSignalCards(stats: readonly NumberStat[]) {
  const hot = [...stats].sort((left, right) => right.hitCount - left.hitCount)[0];
  const cold = [...stats].sort((left, right) => left.hitCount - right.hitCount)[0];
  const overdue = [...stats].sort(
    (left, right) => right.missingDrawCount - left.missingDrawCount
  )[0];

  return [
    {
      hint: hot ? `${hot.hitCount} ครั้งในช่วงที่เลือก` : "ไม่มีข้อมูล",
      label: "Hot",
      tone: "hot" as const,
      value: hot?.number ?? "-"
    },
    {
      hint: cold ? `${cold.hitCount} ครั้งในช่วงที่เลือก` : "ไม่มีข้อมูล",
      label: "Cold",
      tone: "cold" as const,
      value: cold?.number ?? "-"
    },
    {
      hint: overdue ? `ห่างล่าสุด ${overdue.missingDrawCount} งวด` : "ไม่มีข้อมูล",
      label: "Overdue",
      tone: "overdue" as const,
      value: overdue?.number ?? "-"
    }
  ];
}

function getPositionDigitStats(
  digitStats: readonly DigitStat[],
  prizeType: FilterContext["prizeType"],
  numberLength: AnalyticsNumberLength
) {
  return digitStats.slice(0, numberLength * 10).map((stat) => ({
    digit: stat.digit,
    hitCount: stat.hitCount,
    id: `${stat.prizeType}-${stat.position ?? 0}-${stat.digit}`,
    label: `${stat.digit} · ${stat.hitCount} ครั้ง`,
    positionLabel: getPositionLabel(stat.position, prizeType, numberLength),
    trendDirection: stat.trendDirection
  }));
}

function getOverallDigitDistribution(digitStats: readonly DigitStat[]) {
  const totals = new Map<string, number>();

  for (const stat of digitStats) {
    totals.set(stat.digit, (totals.get(stat.digit) ?? 0) + stat.hitCount);
  }

  const totalHits = [...totals.values()].reduce((total, value) => total + value, 0);

  return [...totals.entries()]
    .map(([digit, hitCount]) => ({
      digit,
      hitCount,
      sharePercent: totalHits > 0 ? Math.round((hitCount / totalHits) * 1000) / 10 : 0
    }))
    .sort((left, right) => right.hitCount - left.hitCount || left.digit.localeCompare(right.digit));
}

function getShapeSummary(stats: readonly NumberStat[], numberLength: AnalyticsNumberLength) {
  const definitions = getShapeDefinitions(numberLength);

  return definitions.map((definition) => ({
    count: stats.filter((stat) => definition.matches(stat.number)).length,
    id: definition.id,
    label: definition.label,
    sampleSize: stats.length
  }));
}

function getShapeDefinitions(numberLength: AnalyticsNumberLength) {
  const common = [
    { id: "has_repeat", label: "has_repeat", matches: hasRepeat },
    { id: "all_unique", label: "all_unique", matches: isAllUnique },
    { id: "ascending_run", label: "ascending_run", matches: hasAscendingRun },
    { id: "descending_run", label: "descending_run", matches: hasDescendingRun }
  ];

  if (numberLength === 3) {
    return [
      ...common,
      { id: "triple", label: "triple", matches: hasTriple },
      { id: "palindrome", label: "palindrome", matches: isPalindrome },
      { id: "digit_sum_range", label: "digit_sum_range", matches: () => true }
    ];
  }

  if (numberLength === 6) {
    return [
      ...common,
      { id: "double_pair", label: "double_pair", matches: hasDoublePair },
      { id: "triple", label: "triple", matches: hasTriple },
      { id: "digit_sum_range", label: "digit_sum_range", matches: () => true }
    ];
  }

  return [
    { id: "double", label: "double", matches: (number: string) => number[0] === number[1] },
    { id: "ascending", label: "ascending", matches: isFullyAscending },
    { id: "descending", label: "descending", matches: isFullyDescending }
  ];
}

function toRecentExample(stat: NumberStat) {
  return {
    dna: toMiniDna(stat.number),
    flags: getShapeDefinitions(stat.number.length as AnalyticsNumberLength)
      .filter((definition) => definition.matches(stat.number))
      .slice(0, 4)
      .map((definition) => definition.label),
    number: stat.number,
    prizeType: stat.prizeType
  };
}

function getPositionLabel(
  position: number | undefined,
  prizeType: FilterContext["prizeType"],
  numberLength: AnalyticsNumberLength
) {
  const prizeLabel = getPrizeLabel(prizeType);

  if (numberLength === 2) {
    return `${position === 1 ? "หลักสิบ" : "หลักหน่วย"} · ${prizeLabel}`;
  }

  return `ตำแหน่งที่ ${position ?? "-"} · ${prizeLabel}`;
}

function toMiniDna(number: string) {
  return [...number]
    .map((digit) => {
      const value = Number(digit);

      if (value % 2 === 0 && value >= 5) {
        return "E/H";
      }

      if (value % 2 === 0) {
        return "E/L";
      }

      return value >= 5 ? "O/H" : "O/L";
    })
    .join(" ");
}

function hasRepeat(number: string) {
  return new Set([...number]).size < number.length;
}

function isAllUnique(number: string) {
  return new Set([...number]).size === number.length;
}

function hasTriple(number: string) {
  return Object.values(getDigitCounts(number)).some((count) => count === 3);
}

function hasDoublePair(number: string) {
  return Object.values(getDigitCounts(number)).filter((count) => count >= 2).length >= 2;
}

function isPalindrome(number: string) {
  return number.length > 2 && number === [...number].reverse().join("");
}

function isFullyAscending(number: string) {
  const digits = [...number].map(Number);

  return digits.every((digit, index) => index === 0 || digit > digits[index - 1]);
}

function isFullyDescending(number: string) {
  const digits = [...number].map(Number);

  return digits.every((digit, index) => index === 0 || digit < digits[index - 1]);
}

function hasAscendingRun(number: string) {
  const digits = [...number].map(Number);

  return digits.some(
    (digit, index) =>
      index >= 2 && digits[index - 2] + 1 === digits[index - 1] && digits[index - 1] + 1 === digit
  );
}

function hasDescendingRun(number: string) {
  const digits = [...number].map(Number);

  return digits.some(
    (digit, index) =>
      index >= 2 && digits[index - 2] - 1 === digits[index - 1] && digits[index - 1] - 1 === digit
  );
}

function getDigitCounts(number: string) {
  return [...number].reduce<Record<string, number>>((counts, digit) => {
    counts[digit] = (counts[digit] ?? 0) + 1;

    return counts;
  }, {});
}
