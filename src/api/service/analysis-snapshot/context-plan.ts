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
import { getPrisma } from "@/api/service/prisma";

export type AnalysisContextPlanInput = {
  month?: AnalysisMonth;
  prizeType?: AnalysisPrizeType;
  scope?: AnalysisScope;
  year?: number;
  years?: readonly number[];
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
    label: "Single UTC calendar month and year",
    filterNote:
      "EXTRACT(MONTH) and EXTRACT(YEAR) from drawDate match context month and year. Full eligible draws in that month (no cap)."
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

/** Month+year contexts: 11 prizes × months × years. */
export function listMonthYearAnalysisContexts(
  years: readonly number[],
  input: Pick<AnalysisContextPlanInput, "month" | "prizeType"> = {}
): AnalysisContext[] {
  const prizeTypes = input.prizeType ? [input.prizeType] : [...ANALYSIS_PRIZE_TYPES];
  const months = input.month ? [input.month] : [...ANALYSIS_MONTHS];

  return prizeTypes.flatMap((prizeType) =>
    months.flatMap((month) =>
      years.map((year) =>
        createAnalysisContext({
          month,
          prizeType,
          scope: "MONTH",
          year
        })
      )
    )
  );
}

/** Full compute plan: ALL_TIME + MONTH×year for each year in `years` (or discovered). */
export function listAnalysisContexts(input: AnalysisContextPlanInput = {}): AnalysisContext[] {
  const scopes = input.scope ? [input.scope] : [...ANALYSIS_SCOPES];
  const years = input.years ?? (input.year !== undefined ? [input.year] : []);
  const contexts: AnalysisContext[] = [];

  if (scopes.includes("ALL_TIME")) {
    contexts.push(...listAllTimeAnalysisContexts({ prizeType: input.prizeType }));
  }

  if (scopes.includes("MONTH") && years.length > 0) {
    contexts.push(
      ...listMonthYearAnalysisContexts(years, { month: input.month, prizeType: input.prizeType })
    );
  }

  return contexts;
}

export function getExpectedAnalysisContextCount(years: readonly number[]) {
  const monthContexts = ANALYSIS_PRIZE_TYPES.length * ANALYSIS_MONTHS.length * years.length;
  return ANALYSIS_PRIZE_TYPES.length + monthContexts;
}

export async function discoverAnalysisDrawYears(): Promise<number[]> {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{ year: number }>>`
    SELECT DISTINCT EXTRACT(YEAR FROM "drawDate")::int AS "year"
    FROM "lottery_draws"
    WHERE "lotteryType" = 'THAI_GOVERNMENT'::"LotteryType"
    ORDER BY "year" ASC
  `;

  return rows.map((row) => row.year);
}
