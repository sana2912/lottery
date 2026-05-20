import type { AnalysisScope } from "@/api/service/analysis-snapshot/analysis-context";

/** v8 matrix does not use year discovery; MONTH contexts are month-across-all-years. */
export function resolveComputeYearPlan(_input: {
  scope?: AnalysisScope;
  year?: number;
  years?: number[];
}) {
  return { mode: "none" as const };
}

export async function resolveComputeYears(_input: {
  scope?: AnalysisScope;
  year?: number;
  years?: number[];
}) {
  return undefined;
}
