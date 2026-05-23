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
import {
  getPatternDefinitionsForPrizeType,
  getPatternPrizeNumberLength,
  getSnapshotOverviewByPattern,
  hasSequencePatternCardsForPrize,
  type PatternDefinition,
  type PatternTone,
  resolvePatternOverviewHitCount,
  roundPatternPercent
} from "@/lib/app/pattern-playground";
import { generateRandomPatternNumbers } from "@/lib/app/pattern-random-examples";
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

export type { PatternTone };

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
  synthetic?: boolean;
};

export type { PatternDistributionItem };

export type PatternPageQuery = {
  exampleSeed?: string;
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

function matchesShape(flag: NumberShapeFlag) {
  return (number: string) => hasNumberShapeFlag(number, flag);
}

export function parsePatternSearchParams(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): PatternPageQuery {
  const record = toSearchParamRecord(searchParams);
  const prizeType = getSingleValue(record.prizeType);
  const scope = getSingleValue(record.scope);
  const month = Number(getSingleValue(record.month));
  const pattern = getSingleValue(record.pattern);
  const exampleSeed = getSingleValue(record.exampleSeed);
  const parsedScope = scope === "MONTH" ? "MONTH" : "ALL_TIME";
  const normalized = normalizeProductAnalysisQuery({
    lotteryType: "THAI_GOVERNMENT",
    month: parsedScope === "MONTH" && isValidMonth(month) ? month : undefined,
    page: 1,
    pageSize: 20,
    scope: parsedScope
  });

  const query: PatternPageQuery = {
    exampleSeed: exampleSeed || undefined,
    month: normalized.month,
    pattern: pattern || undefined,
    prizeType: isPatternPrizeValue(prizeType) ? prizeType : "TWO_DIGIT",
    scope: normalized.scope
  };

  return sanitizePatternQuery(query);
}

export function sanitizePatternQuery(query: PatternPageQuery): PatternPageQuery {
  if (!query.pattern) {
    return query;
  }

  const allowedIds = new Set(getDefinitionsForStats(query).map((definition) => definition.id));

  if (allowedIds.has(query.pattern)) {
    return query;
  }

  return { ...query, pattern: undefined };
}

export function hasSequencePatternCards(prizeType: PatternPrizeValue) {
  return hasSequencePatternCardsForPrize(prizeType);
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

  if (next.exampleSeed) {
    searchParams.set("exampleSeed", next.exampleSeed);
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
  const examples = getExamples(stats, definitions, query, activePattern);

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
    const value = resolvePatternOverviewHitCount(overviewByPattern, definition);
    const percent = totalHits > 0 ? roundPatternPercent((value / totalHits) * 100) : 0;
    const overview = overviewByPattern.get(definition.flag) ?? overviewByPattern.get(definition.id);
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
    examples: getSnapshotExamples(snapshot.pattern, definitions, query, activePattern),
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
  return getPatternDefinitionsForPrizeType(query.prizeType);
}

function toOverviewCard(
  definition: PatternDefinition,
  stats: readonly NumberStat[],
  totalHits: number,
  query: PatternPageQuery
): PatternOverviewCard {
  const matches = stats.filter((stat) => definition.matches(stat.number));
  const value = getTotalHits(matches);
  const percent = totalHits > 0 ? roundPatternPercent((value / totalHits) * 100) : 0;
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
  query: PatternPageQuery,
  activePattern?: string
): PatternExample[] {
  const activeDefinition = definitions.find((definition) => definition.id === activePattern);

  if (activeDefinition) {
    return buildRandomPatternExamples(activeDefinition, definitions, query, stats);
  }

  const visibleStats = stats.filter((stat) =>
    definitions.some((definition) => definition.matches(stat.number))
  );

  return visibleStats
    .slice(0, 12)
    .map((stat) => toPatternExample(stat.number, definitions, stat.prizeType));
}

function buildRandomPatternExamples(
  activeDefinition: PatternDefinition,
  definitions: readonly PatternDefinition[],
  query: PatternPageQuery,
  stats: readonly NumberStat[]
): PatternExample[] {
  const length = getPrizeNumberLength(query.prizeType);
  const seed =
    query.exampleSeed ??
    `${query.prizeType}:${activeDefinition.id}:${query.scope}:${query.month ?? "all"}`;
  const randomNumbers = generateRandomPatternNumbers({
    count: 12,
    length,
    matches: activeDefinition.matches,
    seed
  });
  const examples = randomNumbers.map((number) =>
    toPatternExample(number, definitions, query.prizeType, true)
  );

  if (examples.length >= 12) {
    return examples;
  }

  const historical = stats
    .filter((stat) => activeDefinition.matches(stat.number))
    .map((stat) => toPatternExample(stat.number, definitions, stat.prizeType));

  return uniquePatternExamples([...examples, ...historical]).slice(0, 12);
}

function toPatternExample(
  number: string,
  definitions: readonly PatternDefinition[],
  prizeType: string,
  synthetic = false
): PatternExample {
  return {
    dna: getMiniDna(number),
    flags: definitions
      .filter((definition) => definition.matches(number))
      .slice(0, 4)
      .map((definition) => definition.label),
    number,
    prizeType,
    synthetic
  };
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

function getSnapshotExamples(
  snapshot: AnalysisPatternReadModel,
  definitions: readonly PatternDefinition[],
  query: PatternPageQuery,
  activePattern?: string
): PatternExample[] {
  const activeDefinition = definitions.find((definition) => definition.id === activePattern);

  if (activeDefinition) {
    const prizeType = snapshot.examples[0]?.prizeType ?? query.prizeType;
    const syntheticExamples = buildRandomPatternExamples(
      activeDefinition,
      definitions,
      query,
      []
    ).map((example) => ({ ...example, prizeType }));

    if (syntheticExamples.length >= 12) {
      return syntheticExamples;
    }

    const definitionByFlag = new Map(
      definitions.map((definition) => [definition.flag, definition])
    );
    const historical = snapshot.examples
      .filter((example) => example.flags.includes(activeDefinition.flag))
      .map((example) => toPatternExampleFromSnapshot(example, definitions, definitionByFlag));

    return uniquePatternExamples([...syntheticExamples, ...historical]).slice(0, 12);
  }

  const definitionByFlag = new Map(definitions.map((definition) => [definition.flag, definition]));

  return uniquePatternExamples(
    snapshot.examples.map((example) =>
      toPatternExampleFromSnapshot(example, definitions, definitionByFlag)
    )
  ).slice(0, 12);
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
  const sequenceRule =
    label === "Ascending"
      ? " Every digit is strictly greater than the previous."
      : label === "Descending"
        ? " Every digit is strictly less than the previous."
        : "";

  return `Found ${label.toLowerCase()}${sequenceRule} ${value} of ${total} records in ${sampleLabel} (${percent}%).${exampleCopy}`;
}
function getTotalHits(stats: readonly NumberStat[]) {
  return stats.reduce((total, stat) => total + stat.hitCount, 0);
}

function getPrizeNumberLength(prizeType: PatternPrizeValue): 2 | 3 | 6 {
  return getPatternPrizeNumberLength(prizeType);
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
