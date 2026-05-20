import type { AnalysisScope } from "@/api/service/analysis-snapshot/analysis-context";
import { discoverAnalysisDrawYears } from "@/api/service/analysis-snapshot/context-plan";

export type ComputeYearPlan =
  | { mode: "none" }
  | { mode: "discover" }
  | { mode: "explicit"; years: number[] };

/** Pure plan: full run must discover years (not skip MONTH matrix). */
export function resolveComputeYearPlan(input: {
  scope?: AnalysisScope;
  year?: number;
  years?: number[];
}): ComputeYearPlan {
  if (input.years !== undefined) {
    return { mode: "explicit", years: input.years };
  }

  if (input.year !== undefined) {
    return { mode: "explicit", years: [input.year] };
  }

  if (input.scope === "ALL_TIME") {
    return { mode: "none" };
  }

  return { mode: "discover" };
}

export async function resolveComputeYears(input: {
  scope?: AnalysisScope;
  year?: number;
  years?: number[];
}) {
  const plan = resolveComputeYearPlan(input);

  if (plan.mode === "none") {
    return undefined;
  }

  if (plan.mode === "explicit") {
    return plan.years;
  }

  return discoverAnalysisDrawYears();
}
