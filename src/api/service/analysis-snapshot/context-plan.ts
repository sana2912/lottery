import {
  ANALYSIS_MONTHS,
  ANALYSIS_PRIZE_TYPES,
  ANALYSIS_SCOPES,
  ANALYSIS_WINDOW_PRESETS,
  type AnalysisContext,
  type AnalysisMonth,
  type AnalysisPrizeType,
  type AnalysisScope,
  type AnalysisWindowPreset,
  createAnalysisContext
} from "@/api/service/analysis-snapshot/analysis-context";

export type AnalysisContextPlanInput = {
  month?: AnalysisMonth;
  prizeType?: AnalysisPrizeType;
  scope?: AnalysisScope;
  windowPreset?: AnalysisWindowPreset;
};

/** Human-readable semantics for each window preset (audit + docs). */
export const ANALYSIS_WINDOW_SEMANTICS: Record<
  AnalysisWindowPreset,
  {
    drawCap: number | null;
    label: string;
    weightNote: string;
  }
> = {
  "50": {
    drawCap: 50,
    label: "Last 50 eligible draws",
    weightNote:
      "Uses the 50 most recent draws (by drawDate) that contain the prize filter in scope. Not calendar-weighted."
  },
  "100": {
    drawCap: 100,
    label: "Last 100 eligible draws",
    weightNote:
      "Same as 50, with cap 100. Under-filled when fewer than 100 eligible draws exist in scope."
  },
  "500": {
    drawCap: 500,
    label: "Last 500 eligible draws",
    weightNote:
      "Same as 50, with cap 500. Early database years may never reach 500 eligible draws per month."
  },
  ALL: {
    drawCap: null,
    label: "All eligible draws in scope",
    weightNote:
      "No draw cap. Analytics windowSize equals sampleDrawCount. Heavier weight on entire history in scope."
  }
};

export const ANALYSIS_SCOPE_SEMANTICS: Record<
  AnalysisScope,
  { label: string; filterNote: string }
> = {
  ALL_TIME: {
    label: "All calendar months",
    filterNote: "Any drawDate up to now with matching source prize types."
  },
  MONTH: {
    label: "Single UTC calendar month",
    filterNote:
      "EXTRACT(MONTH FROM drawDate) equals context month (1–12). Independent of window preset cap."
  }
};

/** Full compute/snapshot matrix: 11 prizes × 4 windows × (1 ALL_TIME + 12 MONTH) = 572 contexts. */
export function listAnalysisContexts(input: AnalysisContextPlanInput = {}): AnalysisContext[] {
  const prizeTypes = input.prizeType ? [input.prizeType] : [...ANALYSIS_PRIZE_TYPES];
  const windowPresets = input.windowPreset ? [input.windowPreset] : [...ANALYSIS_WINDOW_PRESETS];
  const scopes = input.scope ? [input.scope] : [...ANALYSIS_SCOPES];

  return prizeTypes.flatMap((prizeType) =>
    windowPresets.flatMap((windowPreset) =>
      scopes.flatMap((scope) =>
        getMonthsForScope(scope, input.month).map((month) =>
          createAnalysisContext({
            month,
            prizeType,
            scope,
            windowPreset
          })
        )
      )
    )
  );
}

export function getExpectedAnalysisContextCount() {
  return listAnalysisContexts().length;
}

function getMonthsForScope(scope: AnalysisScope, selectedMonth?: AnalysisMonth) {
  if (scope === "ALL_TIME") {
    return [undefined];
  }

  return selectedMonth ? [selectedMonth] : [...ANALYSIS_MONTHS];
}
