import {
  normalizeProductAnalysisQuery,
  productAnalysisScopeLabel
} from "@/lib/app/analysis-product-scope";
import { getMiniDna, hasNumberShapeFlag, type NumberShapeFlag } from "@/lib/app/number-shape";
import {
  buildPatternDistributionCountsFromHits,
  buildPatternDistributionItems,
  type PatternDistributionItem
} from "@/lib/app/pattern-distribution";
import type { AnalyticsReadModel, NumberStat } from "@/schema/app/analytics.schema";
import type { AnalysisPatternReadModel, PatternsApiReadModel } from "@/schema/app/patterns.schema";
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

export type { PatternDistributionItem };

export type PatternPageQuery = {
  month?: number;
  pattern?: string;
  prizeType: PatternPrizeValue;
  scope: NonNullable<FilterContext["scope"]>;
};

export type PatternReadModel = {
  activePattern?: string;
  distribution: PatternDistributionItem[];
  drawCount: number;
  examples: PatternExample[];
  generatedAt: string;
  numberLengthLabel: string;
  overviewCards: PatternOverviewCard[];
  playground: Array<{ id: string; label: string }>;
  prizeLabel: string;
  prizeType: PatternPrizeValue;
  sampleSize: number;
  scope: NonNullable<FilterContext["scope"]>;
  scopeLabel: string;
  totalHits: number;
  sampleLabel: string;
};

type PatternDefinition = {
  flag: NumberShapeFlag;
  id: string;
  label: string;
  matches: (number: string) => boolean;
  tone: PatternTone;
};

function matchesShape(flag: NumberShapeFlag) {
  return (number: string) => hasNumberShapeFlag(number, flag);
}

function definePattern(
  flag: NumberShapeFlag,
  id: string,
  label: string,
  tone: PatternTone
): PatternDefinition {
  return { flag, id, label, matches: matchesShape(flag), tone };
}

const patternDefinitions: PatternDefinition[] = [
  definePattern("odd", "odd_last_digit", "Odd last digit", "neutral"),
  definePattern("even", "even_last_digit", "Even last digit", "neutral"),
  definePattern("high", "high_last_digit", "High last digit", "hot"),
  definePattern("low", "low_last_digit", "Low last digit", "cold"),
  definePattern("double", "double", "Double", "overdue"),
  definePattern("has_repeat", "has_repeat", "Has repeat", "overdue"),
  definePattern("all_unique", "all_unique", "All unique", "success"),
  definePattern("double_pair", "double_pair", "Double pair", "overdue"),
  definePattern("triple", "triple", "Triple", "warning"),
  definePattern("quad_or_more", "quad_or_more", "Quad or more", "warning"),
  definePattern("ascending", "ascending", "Ascending", "success"),
  definePattern("descending", "descending", "Descending", "warning"),
  definePattern("ascending_run", "ascending_run", "Ascending run", "success"),
  definePattern("descending_run", "descending_run", "Descending run", "warning"),
  definePattern("mirror", "mirror", "Mirror / reverse", "neutral"),
  definePattern("palindrome", "palindrome", "Palindrome", "neutral"),
  definePattern("balanced_odd_even", "balanced_odd_even", "Odd/even balance", "success"),
  definePattern("balanced_high_low", "balanced_high_low", "High/low balance", "success"),
  definePattern("low_sum", "low_sum", "Low digit sum", "cold"),
  definePattern("mid_sum", "mid_sum", "Mid digit sum", "neutral"),
  definePattern("high_sum", "high_sum", "High digit sum", "hot")
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
  const scope = getSingleValue(record.scope);
  const month = Number(getSingleValue(record.month));
  const pattern = getSingleValue(record.pattern);
  const parsedScope = scope === "MONTH" ? "MONTH" : "ALL_TIME";
  const normalized = normalizeProductAnalysisQuery({
    lotteryType: "THAI_GOVERNMENT",
    month: parsedScope === "MONTH" && isValidMonth(month) ? month : undefined,
    page: 1,
    pageSize: 20,
    scope: parsedScope
  });

  return {
    month: normalized.month,
    pattern: pattern || undefined,
    prizeType: isPatternPrizeValue(prizeType) ? prizeType : "TWO_DIGIT",
    scope: normalized.scope
  };
}

export function toPatternsAnalyticsQuery(query: PatternPageQuery): FilterContext {
  return normalizeProductAnalysisQuery({
    lotteryType: "THAI_GOVERNMENT",
    month: query.month,
    numberLength: getPrizeNumberLength(query.prizeType),
    page: 1,
    pageSize: 100,
    prizeType: query.prizeType,
    scope: query.scope,
    windowPreset: "ALL"
  });
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
    toOverviewCard(definition, stats, totalHits, query)
  );
  const activePattern = overviewCards.some((card) => card.id === query.pattern)
    ? query.pattern
    : undefined;
  const examples = getExamples(stats, definitions, activePattern);

  return {
    activePattern,
    distribution: getDistribution(stats, totalHits),
    drawCount: analytics.summary.drawCount,
    examples,
    generatedAt: analytics.generatedAt,
    numberLengthLabel: getNumberLengthLabel(query.prizeType),
    overviewCards,
    playground: definitions.map(({ id, label }) => ({ id, label })),
    prizeLabel: getPrizeLabel(query.prizeType),
    prizeType: query.prizeType,
    sampleSize: totalHits,
    scope: query.scope,
    scopeLabel: getScopeLabel(query),
    totalHits,
    sampleLabel: getSampleLabel(query, analytics.summary.drawCount)
  };
}

export function buildPatternReadModelFromSnapshot(
  snapshot: PatternsApiReadModel,
  query: PatternPageQuery
): PatternReadModel {
  const definitions = getDefinitionsForStats(query);
  const overviewByPattern = getSnapshotOverviewByPattern(snapshot.pattern);
  const totalHits = snapshot.pattern.sampleSize;
  const overviewCards = definitions.map((definition) => {
    const overview = overviewByPattern.get(definition.flag) ?? overviewByPattern.get(definition.id);
    const value = overview?.hitCount ?? 0;
    const percent = totalHits > 0 ? round((value / totalHits) * 100) : 0;
    const examples = overview?.examples.slice(0, 3) ?? [];

    return {
      examples,
      id: definition.id,
      label: definition.label,
      percent,
      summary: getHumanSummary(definition.label, value, totalHits, percent, query, examples),
      tone: definition.tone,
      total: totalHits,
      value
    };
  });
  const activePattern = overviewCards.some((card) => card.id === query.pattern)
    ? query.pattern
    : undefined;

  return {
    activePattern,
    distribution: snapshot.pattern.distribution,
    drawCount: snapshot.summary.drawCount,
    examples: getSnapshotExamples(snapshot.pattern, definitions, activePattern),
    generatedAt: snapshot.generatedAt,
    numberLengthLabel: getNumberLengthLabel(query.prizeType),
    overviewCards,
    playground: definitions.map(({ id, label }) => ({ id, label })),
    prizeLabel: getPrizeLabel(query.prizeType),
    prizeType: query.prizeType,
    sampleSize: totalHits,
    scope: query.scope,
    scopeLabel: getScopeLabel(query),
    totalHits,
    sampleLabel: getSampleLabel(query, snapshot.summary.drawCount)
  };
}

export function buildEmptyPatternReadModel(query: PatternPageQuery): PatternReadModel {
  const generatedAt = new Date().toISOString();

  return {
    activePattern: undefined,
    distribution: [],
    drawCount: 0,
    examples: [],
    generatedAt,
    numberLengthLabel: getNumberLengthLabel(query.prizeType),
    overviewCards: [],
    playground: getDefinitionsForStats(query).map(({ id, label }) => ({ id, label })),
    prizeLabel: getPrizeLabel(query.prizeType),
    prizeType: query.prizeType,
    sampleSize: 0,
    scope: query.scope,
    scopeLabel: getScopeLabel(query),
    totalHits: 0,
    sampleLabel: getSampleLabel(query, 0)
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
  query: PatternPageQuery
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
    summary: getHumanSummary(definition.label, value, totalHits, percent, query, examples),
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
  return buildPatternDistributionItems(
    buildPatternDistributionCountsFromHits(stats, totalHits, {
      allUnique: matchesShape("all_unique"),
      balancedHighLow: matchesShape("balanced_high_low"),
      balancedOddEven: matchesShape("balanced_odd_even"),
      hasRepeat: matchesShape("has_repeat")
    })
  );
}

function getSnapshotOverviewByPattern(snapshot: AnalysisPatternReadModel) {
  const overviewByPattern = new Map<string, AnalysisPatternReadModel["overview"][number]>();

  for (const overview of snapshot.overview) {
    overviewByPattern.set(normalizeSnapshotPatternId(overview.pattern ?? overview.id), overview);
  }

  return overviewByPattern;
}

function getSnapshotExamples(
  snapshot: AnalysisPatternReadModel,
  definitions: readonly PatternDefinition[],
  activePattern?: string
): PatternExample[] {
  const activeDefinition = definitions.find((definition) => definition.id === activePattern);
  const definitionByFlag = new Map(definitions.map((definition) => [definition.flag, definition]));
  const snapshotExamples = activeDefinition
    ? snapshot.examples.filter((example) => example.flags.includes(activeDefinition.flag))
    : snapshot.examples;
  const examples = snapshotExamples.map((example) =>
    toPatternExampleFromSnapshot(example, definitions, definitionByFlag)
  );

  if (!activeDefinition || examples.length >= 12) {
    return uniquePatternExamples(examples).slice(0, 12);
  }

  const overviewByPattern = getSnapshotOverviewByPattern(snapshot);
  const overviewExamples =
    overviewByPattern.get(activeDefinition.flag)?.examples ??
    overviewByPattern.get(activeDefinition.id)?.examples ??
    [];
  const supplementalExamples = overviewExamples.map((number) => ({
    dna: getMiniDna(number),
    flags: definitions
      .filter((definition) => definition.matches(number))
      .slice(0, 4)
      .map((definition) => definition.label),
    number,
    prizeType: snapshot.examples[0]?.prizeType ?? ""
  }));

  return uniquePatternExamples([...examples, ...supplementalExamples]).slice(0, 12);
}

function toPatternExampleFromSnapshot(
  example: AnalysisPatternReadModel["examples"][number],
  definitions: readonly PatternDefinition[],
  definitionByFlag: ReadonlyMap<NumberShapeFlag, PatternDefinition>
): PatternExample {
  const labels = example.flags
    .map((flag) => definitionByFlag.get(flag)?.label)
    .filter((label): label is string => Boolean(label));
  const fallbackLabels = definitions
    .filter((definition) => definition.matches(example.number))
    .slice(0, 4)
    .map((definition) => definition.label);

  return {
    dna: example.dna,
    flags: labels.length > 0 ? labels.slice(0, 4) : fallbackLabels,
    number: example.number,
    prizeType: example.prizeType
  };
}

function uniquePatternExamples(examples: readonly PatternExample[]) {
  const seen = new Set<string>();

  return examples.filter((example) => {
    const key = `${example.prizeType}-${example.number}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeSnapshotPatternId(value: string) {
  return value.startsWith("pattern-") ? value.slice("pattern-".length) : value;
}

function getHumanSummary(
  label: string,
  value: number,
  total: number,
  percent: number,
  query: PatternPageQuery,
  examples: readonly string[]
) {
  const sampleLabel = getSampleLabel(query, total);
  const exampleCopy = examples.length > 0 ? ` Examples: ${examples.join(", ")}` : "";

  return `Found ${label.toLowerCase()} ${value} of ${total} records in ${sampleLabel} (${percent}%).${exampleCopy}`;
}
function getTotalHits(stats: readonly NumberStat[]) {
  return stats.reduce((total, stat) => total + stat.hitCount, 0);
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

function getSampleLabel(query: PatternPageQuery, drawCount: number) {
  return `${drawCount} draws · ${getScopeLabel(query)}`;
}

function getScopeLabel(query: PatternPageQuery) {
  const scope = query.scope === "ALL_TIME" ? "ALL_TIME" : "MONTH";

  return productAnalysisScopeLabel(scope, query.month);
}

function getNumberLengthLabel(prizeType: PatternPrizeValue) {
  const length = getPrizeNumberLength(prizeType);
  return `${length} digits`;
}

function isPatternPrizeValue(value: string | undefined): value is PatternPrizeValue {
  return patternPrizeOptions.some((option) => option.value === value);
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
