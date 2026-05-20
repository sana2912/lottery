import type { FilterContext } from "@/schema/app/query.schema";

export const ANALYSIS_ENGINE_VERSION = "analysis-engine-v4";

export const ANALYSIS_PRIZE_TYPES = [
  "TWO_DIGIT",
  "THREE_DIGIT",
  "THREE_FRONT",
  "THREE_BACK",
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "SIX_DIGIT_ALL"
] as const;

export const SIX_DIGIT_SOURCE_PRIZE_TYPES = [
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5"
] as const;

export const ANALYSIS_WINDOW_PRESETS = ["50", "100", "500", "ALL"] as const;
export const ANALYSIS_SCOPES = ["ALL_TIME", "MONTH"] as const;
export const ANALYSIS_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type AnalysisPrizeType = (typeof ANALYSIS_PRIZE_TYPES)[number];
export type AnalysisSourcePrizeType = Exclude<AnalysisPrizeType, "SIX_DIGIT_ALL">;
export type AnalysisWindowPreset = (typeof ANALYSIS_WINDOW_PRESETS)[number];
export type AnalysisScope = (typeof ANALYSIS_SCOPES)[number];
export type AnalysisMonth = (typeof ANALYSIS_MONTHS)[number];

export type AnalysisContext = {
  engineVersion: string;
  lotteryType: FilterContext["lotteryType"];
  month?: AnalysisMonth;
  numberLength: 2 | 3 | 6;
  prizeType: AnalysisPrizeType;
  scope: AnalysisScope;
  windowPreset: AnalysisWindowPreset;
};

export type AnalysisContextInput = Partial<
  Pick<AnalysisContext, "engineVersion" | "lotteryType" | "month" | "scope">
> & {
  prizeType: string;
  windowPreset: string;
};

export function createAnalysisContext(input: AnalysisContextInput): AnalysisContext {
  const prizeType = parseAnalysisPrizeType(input.prizeType);
  const scope = parseAnalysisScope(input.scope ?? "ALL_TIME");
  const windowPreset = parseAnalysisWindowPreset(input.windowPreset);
  const month = scope === "MONTH" ? parseAnalysisMonth(input.month) : undefined;

  return {
    engineVersion: input.engineVersion ?? ANALYSIS_ENGINE_VERSION,
    lotteryType: input.lotteryType ?? "THAI_GOVERNMENT",
    month,
    numberLength: getAnalysisPrizeNumberLength(prizeType),
    prizeType,
    scope,
    windowPreset
  };
}

export function getAnalysisContextKey(context: AnalysisContext) {
  return [
    context.engineVersion,
    context.lotteryType,
    context.prizeType,
    context.numberLength,
    context.scope,
    context.month ?? "ALL_MONTHS",
    context.windowPreset
  ].join("|");
}

export function getAnalysisWindowLimit(windowPreset: AnalysisWindowPreset) {
  return windowPreset === "ALL" ? undefined : Number(windowPreset);
}

export function getAnalysisPrizeNumberLength(prizeType: AnalysisPrizeType): 2 | 3 | 6 {
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

export function getAnalysisPrizeSourceTypes(
  prizeType: AnalysisPrizeType
): readonly AnalysisSourcePrizeType[] {
  return prizeType === "SIX_DIGIT_ALL" ? SIX_DIGIT_SOURCE_PRIZE_TYPES : [prizeType];
}

export function isGroupedAnalysisPrizeType(prizeType: string | undefined) {
  return prizeType === "SIX_DIGIT_ALL";
}

export function isAnalysisPrizeType(value: string): value is AnalysisPrizeType {
  return ANALYSIS_PRIZE_TYPES.includes(value as AnalysisPrizeType);
}

export function isAnalysisWindowPreset(value: string): value is AnalysisWindowPreset {
  return ANALYSIS_WINDOW_PRESETS.includes(value as AnalysisWindowPreset);
}

export function isAnalysisScope(value: string): value is AnalysisScope {
  return ANALYSIS_SCOPES.includes(value as AnalysisScope);
}

function parseAnalysisPrizeType(value: string): AnalysisPrizeType {
  if (isAnalysisPrizeType(value)) {
    return value;
  }

  throw new Error(
    `Invalid analysis prizeType "${value}". Supported values: ${ANALYSIS_PRIZE_TYPES.join(", ")}`
  );
}

function parseAnalysisWindowPreset(value: string): AnalysisWindowPreset {
  if (isAnalysisWindowPreset(value)) {
    return value;
  }

  throw new Error(
    `Invalid analysis windowPreset "${value}". Supported values: ${ANALYSIS_WINDOW_PRESETS.join(", ")}`
  );
}

function parseAnalysisScope(value: string): AnalysisScope {
  if (isAnalysisScope(value)) {
    return value;
  }

  throw new Error(
    `Invalid analysis scope "${value}". Supported values: ${ANALYSIS_SCOPES.join(", ")}`
  );
}

function parseAnalysisMonth(value: number | undefined): AnalysisMonth {
  if (ANALYSIS_MONTHS.includes(value as AnalysisMonth)) {
    return value as AnalysisMonth;
  }

  throw new Error("MONTH scope requires month 1..12.");
}
