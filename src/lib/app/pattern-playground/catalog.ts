import { hasNumberShapeFlag, type NumberShapeFlag } from "@/lib/app/number-shape";
import { getPredictionNumberLength } from "@/lib/app/prediction";
import type { ApiLotteryPrizeType } from "@/schema/api/query";

export type PatternTone = "cold" | "hot" | "neutral" | "overdue" | "success" | "warning";

export type PatternDefinition = {
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

export const patternDefinitions: PatternDefinition[] = [
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
    "ascending",
    "descending",
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
    "balanced_odd_even",
    "balanced_high_low",
    "low_sum",
    "mid_sum",
    "high_sum"
  ]
} as const;

export function getPatternPrizeNumberLength(prizeType: string): 2 | 3 | 6 {
  if (prizeType === "SIX_DIGIT_ALL") {
    return 6;
  }

  if (prizeType === "THREE_DIGIT" || prizeType === "THREE_FRONT" || prizeType === "THREE_BACK") {
    return 3;
  }

  if (prizeType === "TWO_DIGIT") {
    return 2;
  }

  return getPredictionNumberLength(prizeType as ApiLotteryPrizeType);
}

export function getPatternDefinitionsForPrizeType(prizeType: string): PatternDefinition[] {
  const length = getPatternPrizeNumberLength(prizeType);
  const ids = new Set<string>(definitionIdsByLength[length] ?? []);

  return patternDefinitions.filter((definition) => ids.has(definition.id));
}

export function getPatternDefinitionById(
  patternId: string,
  prizeType: string
): PatternDefinition | undefined {
  return getPatternDefinitionsForPrizeType(prizeType).find(
    (definition) => definition.id === patternId
  );
}

export function hasSequencePatternCardsForPrize(prizeType: string) {
  const length = getPatternPrizeNumberLength(prizeType);
  return length === 2 || length === 3;
}
