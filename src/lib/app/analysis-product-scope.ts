import type { FilterContext } from "@/schema/app/query.schema";

const MONTH_LABELS = [
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
] as const;

export type ProductAnalysisScope = "ALL_TIME" | "MONTH";

export function normalizeProductAnalysisQuery<T extends FilterContext>(query: T): T {
  const scope = parseProductScope(query.scope);
  const now = new Date();

  return {
    ...query,
    month: scope === "MONTH" ? (query.month ?? now.getUTCMonth() + 1) : undefined,
    scope,
    windowPreset: "ALL",
    year: undefined
  };
}

export function productAnalysisScopeLabel(scope: ProductAnalysisScope, month?: number) {
  if (scope === "MONTH" && month) {
    const label = MONTH_LABELS[month - 1] ?? "Month";

    return `${label} (all years)`;
  }

  return "All history";
}

function parseProductScope(scope: FilterContext["scope"] | undefined): ProductAnalysisScope {
  return scope === "MONTH" ? "MONTH" : "ALL_TIME";
}
