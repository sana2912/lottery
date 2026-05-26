import type { FilterContext } from "@/schema/app/query.schema";

export const ANALYSIS_ENGINE_VERSION = "analysis-engine-v8";

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

export const ANALYSIS_SCOPES = ["ALL_TIME", "MONTH"] as const;
export const ANALYSIS_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type AnalysisPrizeType = (typeof ANALYSIS_PRIZE_TYPES)[number];
export type AnalysisSourcePrizeType = Exclude<AnalysisPrizeType, "SIX_DIGIT_ALL">;
export type AnalysisScope = (typeof ANALYSIS_SCOPES)[number];
export type AnalysisMonth = (typeof ANALYSIS_MONTHS)[number];

export type AnalysisContext = {
  engineVersion: string;
  lotteryType: FilterContext["lotteryType"];
  month?: AnalysisMonth;
  /** Optional: single calendar year filter. Product/compute omit for month-across-all-years. */
  year?: number;
  numberLength: 2 | 3 | 6;
  prizeType: AnalysisPrizeType;
  scope: AnalysisScope;
};

export type AnalysisContextInput = Partial<
  Pick<AnalysisContext, "engineVersion" | "lotteryType" | "month" | "scope" | "year">
> & {
  prizeType: string;
};

export function createAnalysisContext(input: AnalysisContextInput): AnalysisContext {
  const prizeType = parseAnalysisPrizeType(input.prizeType);
  const scope = parseAnalysisScope(input.scope ?? "ALL_TIME");
  const month = scope === "MONTH" ? parseAnalysisMonth(input.month) : undefined;
  const year =
    scope === "MONTH" && input.year !== undefined ? parseAnalysisYear(input.year) : undefined;

  return {
    engineVersion: input.engineVersion ?? ANALYSIS_ENGINE_VERSION,
    lotteryType: input.lotteryType ?? "THAI_GOVERNMENT",
    month,
    year,
    numberLength: getAnalysisPrizeNumberLength(prizeType),
    prizeType,
    scope
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
    context.scope === "MONTH"
      ? context.year !== undefined
        ? String(context.year)
        : "ALL_YEARS"
      : "ALL_YEARS"
  ].join("|");
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

function parseAnalysisYear(value: number) {
  if (!Number.isInteger(value) || value < 1900 || value > 3000) {
    throw new Error("MONTH scope year must be between 1900 and 3000.");
  }

  return value;
}
