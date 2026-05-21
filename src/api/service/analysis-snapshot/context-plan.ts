import {
  ANALYSIS_MONTHS,
  ANALYSIS_PRIZE_TYPES,
  ANALYSIS_SCOPES,
  type AnalysisContext,
  type AnalysisMonth,
  type AnalysisPrizeType,
  type AnalysisScope,
  createAnalysisContext
} from "@/api/service/analysis-snapshot/analysis-context";

export type AnalysisContextPlanInput = {
  month?: AnalysisMonth;
  prizeType?: AnalysisPrizeType;
  scope?: AnalysisScope;
};

export const ANALYSIS_SCOPE_SEMANTICS: Record<
  AnalysisScope,
  { label: string; filterNote: string }
> = {
  ALL_TIME: {
    label: "All calendar months",
    filterNote: "Any drawDate up to now with matching source prize types (no draw cap)."
  },
  MONTH: {
    label: "Single UTC calendar month (all years)",
    filterNote:
      "EXTRACT(MONTH) from drawDate matches context month across every year. Full eligible draws in that month (no cap)."
  }
};

/** All-time contexts: 11 prize types × 1 window (ALL). */
export function listAllTimeAnalysisContexts(
  input: Pick<AnalysisContextPlanInput, "prizeType"> = {}
): AnalysisContext[] {
  const prizeTypes = input.prizeType ? [input.prizeType] : [...ANALYSIS_PRIZE_TYPES];

  return prizeTypes.map((prizeType) =>
    createAnalysisContext({
      prizeType,
      scope: "ALL_TIME"
    })
  );
}

/** Month-across-years contexts: 11 prizes × 12 months (no year dimension). */
export function listMonthAcrossYearsAnalysisContexts(
  input: Pick<AnalysisContextPlanInput, "month" | "prizeType"> = {}
): AnalysisContext[] {
  const prizeTypes = input.prizeType ? [input.prizeType] : [...ANALYSIS_PRIZE_TYPES];
  const months = input.month ? [input.month] : [...ANALYSIS_MONTHS];

  return prizeTypes.flatMap((prizeType) =>
    months.map((month) =>
      createAnalysisContext({
        month,
        prizeType,
        scope: "MONTH"
      })
    )
  );
}

/** Full compute plan: 11 ALL_TIME + 11×12 MONTH (month across all years). */
export function listAnalysisContexts(input: AnalysisContextPlanInput = {}): AnalysisContext[] {
  const scopes = input.scope ? [input.scope] : [...ANALYSIS_SCOPES];
  const contexts: AnalysisContext[] = [];

  if (scopes.includes("ALL_TIME")) {
    contexts.push(...listAllTimeAnalysisContexts({ prizeType: input.prizeType }));
  }

  if (scopes.includes("MONTH")) {
    contexts.push(
      ...listMonthAcrossYearsAnalysisContexts({
        month: input.month,
        prizeType: input.prizeType
      })
    );
  }

  return contexts;
}

export function getExpectedAnalysisContextCount() {
  return ANALYSIS_PRIZE_TYPES.length + ANALYSIS_PRIZE_TYPES.length * ANALYSIS_MONTHS.length;
}
