import {
  getDigitSum,
  getMiniDna,
  hasNumberShapeFlag,
  type NumberShapeFlag
} from "@/lib/app/number-shape";
import type { AnalyticsReadModel, NumberStat } from "@/schema/app/analytics.schema";
import type { FilterContext } from "@/schema/app/query.schema";

export const patternPrizeOptions = [
  { label: "FIRST", value: "FIRST" },
  { label: "THREE_DIGIT", value: "THREE_DIGIT" },
  { label: "THREE_FRONT", value: "THREE_FRONT" },
  { label: "THREE_BACK", value: "THREE_BACK" },
  { label: "TWO_DIGIT", value: "TWO_DIGIT" },
  { label: "NEAR_FIRST", value: "NEAR_FIRST" },
  { label: "PRIZE2", value: "PRIZE2" },
  { label: "PRIZE3", value: "PRIZE3" },
  { label: "PRIZE4", value: "PRIZE4" },
  { label: "PRIZE5", value: "PRIZE5" },
  { label: "รวมรางวัล 6 หลักทั้งหมด", value: "SIX_DIGIT_ALL" }
] as const;

export const patternWindowOptions = [
  { label: "50 draws", value: "50" },
  { label: "100 draws", value: "100" },
  { label: "500 draws", value: "500" },
  { label: "All draws", value: "ALL" }
] as const;
export const patternScopeOptions = [
  { label: "All months", value: "ALL_TIME" },
  { label: "Specific month", value: "MONTH" }
] as const;
export const patternMonthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
].map((label, index) => ({ label, value: index + 1 }));

type PatternPrizeValue = (typeof patternPrizeOptions)[number]["value"];
type PatternWindowValue = (typeof patternWindowOptions)[number]["value"];

export type PatternTone = "cold" | "hot" | "neutral" | "overdue" | "success" | "warning";

export type PatternOverviewCard = {
  examples: string[];
  id: string;
  label: string;
  percent: number;
  summary: string;
  tone: PatternTone;
  total: number;
  value: number;
};

export type PatternExample = {
  dna: string;
  flags: string[];
  number: string;
  prizeType: string;
};

export type PatternDistributionItem = {
  id: string;
  label: string;
  value: string;
};

export type PatternPageQuery = {
  month?: number;
  pattern?: string;
  prizeType: PatternPrizeValue;
  scope: NonNullable<FilterContext["scope"]>;
  windowPreset: PatternWindowValue;
  windowSize: PatternWindowValue;
};

export type PatternReadModel = {
  activePattern?: string;
  distribution: PatternDistributionItem[];
  examples: PatternExample[];
  numberLengthLabel: string;
  overviewCards: PatternOverviewCard[];
  playground: Array<{ id: string; label: string }>;
  prizeLabel: string;
  prizeType: PatternPrizeValue;
  sampleSize: number;
  scope: NonNullable<FilterContext["scope"]>;
  scopeLabel: string;
  totalHits: number;
  windowLabel: string;
  windowPreset: PatternWindowValue;
  windowSize: PatternWindowValue;
};

type PatternDefinition = {
  id: string;
  label: string;
  matches: (number: string) => boolean;
  tone: PatternTone;
};

function matchesShape(flag: NumberShapeFlag) {
  return (number: string) => hasNumberShapeFlag(number, flag);
}

const patternDefinitions: PatternDefinition[] = [
  { id: "odd_last_digit", label: "Odd last digit", matches: matchesShape("odd"), tone: "neutral" },
  {
    id: "even_last_digit",
    label: "Even last digit",
    matches: matchesShape("even"),
    tone: "neutral"
  },
  { id: "high_last_digit", label: "High last digit", matches: matchesShape("high"), tone: "hot" },
  { id: "low_last_digit", label: "Low last digit", matches: matchesShape("low"), tone: "cold" },
  { id: "double", label: "Double", matches: matchesShape("double"), tone: "overdue" },
  { id: "has_repeat", label: "Has repeat", matches: matchesShape("has_repeat"), tone: "overdue" },
  { id: "all_unique", label: "All unique", matches: matchesShape("all_unique"), tone: "success" },
  {
    id: "double_pair",
    label: "Double pair",
    matches: matchesShape("double_pair"),
    tone: "overdue"
  },
  { id: "triple", label: "Triple", matches: matchesShape("triple"), tone: "warning" },
  {
    id: "quad_or_more",
    label: "Quad or more",
    matches: matchesShape("quad_or_more"),
    tone: "warning"
  },
  { id: "ascending", label: "Ascending", matches: matchesShape("ascending"), tone: "success" },
  {
    id: "descending",
    label: "Descending",
    matches: matchesShape("descending"),
    tone: "warning"
  },
  {
    id: "ascending_run",
    label: "Ascending run",
    matches: matchesShape("ascending_run"),
    tone: "success"
  },
  {
    id: "descending_run",
    label: "Descending run",
    matches: matchesShape("descending_run"),
    tone: "warning"
  },
  { id: "mirror", label: "Mirror / reverse", matches: matchesShape("mirror"), tone: "neutral" },
  { id: "palindrome", label: "Palindrome", matches: matchesShape("palindrome"), tone: "neutral" },
  {
    id: "balanced_odd_even",
    label: "Odd/even balance",
    matches: matchesShape("balanced_odd_even"),
    tone: "success"
  },
  {
    id: "balanced_high_low",
    label: "High/low balance",
    matches: matchesShape("balanced_high_low"),
    tone: "success"
  },
  { id: "low_sum", label: "Low digit sum", matches: matchesShape("low_sum"), tone: "cold" },
  { id: "mid_sum", label: "Mid digit sum", matches: matchesShape("mid_sum"), tone: "neutral" },
  { id: "high_sum", label: "High digit sum", matches: matchesShape("high_sum"), tone: "hot" }
];

const definitionIdsByLength = {
  2: [
    "odd_last_digit",
    "even_last_digit",
    "high_last_digit",
    "low_last_digit",
    "double",
    "ascending",
    "descending",
    "mirror"
  ],
  3: [
    "has_repeat",
    "all_unique",
    "triple",
    "ascending_run",
    "descending_run",
    "palindrome",
    "low_sum",
    "mid_sum",
    "high_sum",
    "balanced_odd_even",
    "balanced_high_low"
  ],
  6: [
    "has_repeat",
    "all_unique",
    "double_pair",
    "triple",
    "quad_or_more",
    "palindrome",
    "ascending_run",
    "descending_run",
    "balanced_odd_even",
    "balanced_high_low",
    "low_sum",
    "mid_sum",
    "high_sum"
  ]
} as const;

export function parsePatternSearchParams(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): PatternPageQuery {
  const record = toSearchParamRecord(searchParams);
  const prizeType = getSingleValue(record.prizeType);
  const windowPreset = getSingleValue(record.windowPreset) ?? getSingleValue(record.windowSize);
  const scope = getSingleValue(record.scope);
  const month = Number(getSingleValue(record.month));
  const pattern = getSingleValue(record.pattern);
  const parsedScope = scope === "MONTH" ? "MONTH" : "ALL_TIME";

  return {
    month: parsedScope === "MONTH" && isValidMonth(month) ? month : undefined,
    pattern: pattern || undefined,
    prizeType: isPatternPrizeValue(prizeType) ? prizeType : "TWO_DIGIT",
    scope: parsedScope,
    windowPreset: isPatternWindowValue(windowPreset) ? windowPreset : "50",
    windowSize: isPatternWindowValue(windowPreset) ? windowPreset : "50"
  };
}

export function toPatternsAnalyticsQuery(query: PatternPageQuery): FilterContext {
  return {
    lotteryType: "THAI_GOVERNMENT",
    month: query.month,
    numberLength: getPrizeNumberLength(query.prizeType),
    page: 1,
    pageSize: 100,
    prizeType: query.prizeType,
    scope: query.scope,
    windowPreset: query.windowPreset,
    windowSize: query.windowPreset === "ALL" ? 2000 : Number(query.windowPreset)
  };
}

export function buildPatternsHref(
  query: PatternPageQuery,
  overrides: Partial<PatternPageQuery> = {}
) {
  const next = { ...query, ...overrides };
  const searchParams = new URLSearchParams();

  if (next.prizeType !== "TWO_DIGIT") {
    searchParams.set("prizeType", next.prizeType);
  }

  if (next.scope !== "ALL_TIME") {
    searchParams.set("scope", next.scope);
  }

  if (next.scope === "MONTH" && next.month) {
    searchParams.set("month", String(next.month));
  }

  if (next.windowPreset !== "50") {
    searchParams.set("windowPreset", next.windowPreset);
  }

  if (next.pattern) {
    searchParams.set("pattern", next.pattern);
  }

  const queryString = searchParams.toString();

  return queryString ? `/patterns?${queryString}` : "/patterns";
}

export function buildPatternReadModel(
  analytics: AnalyticsReadModel,
  query: PatternPageQuery
): PatternReadModel {
  const stats = getPatternStats(analytics, query);
  const definitions = getDefinitionsForStats(query);
  const totalHits = getTotalHits(stats);
  const overviewCards = definitions.map((definition) =>
    toOverviewCard(definition, stats, totalHits, query.windowPreset)
  );
  const activePattern = overviewCards.some((card) => card.id === query.pattern)
    ? query.pattern
    : undefined;
  const examples = getExamples(stats, definitions, activePattern);

  return {
    activePattern,
    distribution: getDistribution(stats, totalHits),
    examples,
    numberLengthLabel: getNumberLengthLabel(query.prizeType),
    overviewCards,
    playground: definitions.map(({ id, label }) => ({ id, label })),
    prizeLabel: getPrizeLabel(query.prizeType),
    prizeType: query.prizeType,
    sampleSize: totalHits,
    scope: query.scope,
    scopeLabel: getScopeLabel(query),
    totalHits,
    windowLabel: getWindowLabel(query.windowPreset),
    windowPreset: query.windowPreset,
    windowSize: query.windowSize
  };
}

function getPatternStats(analytics: AnalyticsReadModel, query: PatternPageQuery) {
  return analytics.numberStats.filter(
    (stat) => stat.prizeType === query.prizeType && [2, 3, 6].includes(stat.number.length)
  );
}

function getDefinitionsForStats(query: PatternPageQuery) {
  const lengths = [getPrizeNumberLength(query.prizeType)];
  const ids = new Set<string>(
    lengths.flatMap((length) => definitionIdsByLength[length as 2 | 3 | 6] ?? [])
  );

  return patternDefinitions.filter((definition) => ids.has(definition.id));
}

function toOverviewCard(
  definition: PatternDefinition,
  stats: readonly NumberStat[],
  totalHits: number,
  windowPreset: PatternWindowValue
): PatternOverviewCard {
  const matches = stats.filter((stat) => definition.matches(stat.number));
  const value = getTotalHits(matches);
  const percent = totalHits > 0 ? round((value / totalHits) * 100) : 0;
  const examples = matches.slice(0, 3).map((stat) => stat.number);

  return {
    examples,
    id: definition.id,
    label: definition.label,
    percent,
    summary: getHumanSummary(definition.label, value, totalHits, percent, windowPreset, examples),
    tone: definition.tone,
    total: totalHits,
    value
  };
}

function getExamples(
  stats: readonly NumberStat[],
  definitions: readonly PatternDefinition[],
  activePattern?: string
): PatternExample[] {
  const activeDefinition = definitions.find((definition) => definition.id === activePattern);
  const visibleStats = activeDefinition
    ? stats.filter((stat) => activeDefinition.matches(stat.number))
    : stats.filter((stat) => definitions.some((definition) => definition.matches(stat.number)));

  return visibleStats.slice(0, 12).map((stat) => ({
    dna: getMiniDna(stat.number),
    flags: definitions
      .filter((definition) => definition.matches(stat.number))
      .slice(0, 4)
      .map((definition) => definition.label),
    number: stat.number,
    prizeType: stat.prizeType
  }));
}

function getDistribution(
  stats: readonly NumberStat[],
  totalHits: number
): PatternDistributionItem[] {
  const repeatCount = getTotalHits(stats.filter((stat) => matchesShape("has_repeat")(stat.number)));
  const uniqueCount = getTotalHits(stats.filter((stat) => matchesShape("all_unique")(stat.number)));
  const balancedOddEvenCount = getTotalHits(
    stats.filter((stat) => matchesShape("balanced_odd_even")(stat.number))
  );
  const balancedHighLowCount = getTotalHits(
    stats.filter((stat) => matchesShape("balanced_high_low")(stat.number))
  );
  const averageUniqueDigits =
    totalHits > 0
      ? round(
          stats.reduce((total, stat) => total + new Set([...stat.number]).size * stat.hitCount, 0) /
            totalHits
        )
      : 0;
  const digitSums = stats.map((stat) => getDigitSum(stat.number));

  return [
    {
      id: "repeat",
      label: "Repeat shape",
      value: `Repeat digits: ${repeatCount} of ${totalHits} records`
    },
    {
      id: "unique",
      label: "Unique shape",
      value: `All-unique digits: ${uniqueCount} of ${totalHits} records`
    },
    {
      id: "odd-even",
      label: "Odd/even balance",
      value: `Balanced in ${getPercent(balancedOddEvenCount, totalHits)}%`
    },
    {
      id: "high-low",
      label: "High/low balance",
      value: `Balanced in ${getPercent(balancedHighLowCount, totalHits)}%`
    },
    {
      id: "sum-range",
      label: "Digit sum range",
      value: digitSums.length > 0 ? `${Math.min(...digitSums)} to ${Math.max(...digitSums)}` : "-"
    },
    {
      id: "unique-distribution",
      label: "Unique digit distribution",
      value: `${averageUniqueDigits} unique digits on average`
    }
  ];
}
function getHumanSummary(
  label: string,
  value: number,
  total: number,
  percent: number,
  windowPreset: PatternWindowValue,
  examples: readonly string[]
) {
  const windowLabel = windowPreset === "ALL" ? "all historical draws" : `${windowPreset} draws`;
  const exampleCopy = examples.length > 0 ? ` Examples: ${examples.join(", ")}` : "";

  return `Found ${label.toLowerCase()} ${value} of ${total} records in ${windowLabel} (${percent}%).${exampleCopy}`;
}
function getTotalHits(stats: readonly NumberStat[]) {
  return stats.reduce((total, stat) => total + stat.hitCount, 0);
}

function getPercent(value: number, total: number) {
  return total > 0 ? round((value / total) * 100) : 0;
}

function getPrizeNumberLength(prizeType: PatternPrizeValue): 2 | 3 | 6 {
  switch (prizeType) {
    case "TWO_DIGIT":
      return 2;
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
    case "SIX_DIGIT_ALL":
      return 6;
  }
}

function getPrizeLabel(prizeType: PatternPrizeValue) {
  return patternPrizeOptions.find((option) => option.value === prizeType)?.label ?? "TWO_DIGIT";
}

function getWindowLabel(windowSize: PatternWindowValue) {
  return patternWindowOptions.find((option) => option.value === windowSize)?.label ?? "50 draws";
}

function getScopeLabel(query: PatternPageQuery) {
  if (query.scope === "MONTH" && query.month) {
    return patternMonthOptions.find((option) => option.value === query.month)?.label ?? "Month";
  }

  return "All months";
}

function getNumberLengthLabel(prizeType: PatternPrizeValue) {
  const length = getPrizeNumberLength(prizeType);
  return `${length} digits`;
}

function isPatternPrizeValue(value: string | undefined): value is PatternPrizeValue {
  return patternPrizeOptions.some((option) => option.value === value);
}

function isPatternWindowValue(value: string | undefined): value is PatternWindowValue {
  return patternWindowOptions.some((option) => option.value === value);
}

function isValidMonth(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

function toSearchParamRecord(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
) {
  if (!searchParams) {
    return {};
  }

  if (searchParams instanceof URLSearchParams) {
    return Object.fromEntries(searchParams.entries());
  }

  return searchParams;
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
