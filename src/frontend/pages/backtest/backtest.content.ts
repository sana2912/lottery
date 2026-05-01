import type { BacktestRequest } from "@/schema/app/backtest.schema";

export const backtestContent = {
  actions: {
    historyButton: "Refresh history",
    loadLabel: "Load",
    methodologyHref: "/methodology#backtest-reading",
    methodologyLabel: "Read how walk-forward backtest is interpreted",
    resultsMethodologyLabel: "Review hit rate, miss streak, and rank guidance",
    runButton: "Run backtest",
    viewingLabel: "Viewing"
  },
  badges: {
    liveApi: "Live API",
    noRun: "No run yet",
    unavailable: "Unavailable"
  },
  emptyState: {
    currentRunDescription:
      "No persisted backtest run is available yet. Run a backtest to generate the first live result set.",
    currentRunTitle: "No backtest run yet",
    fallbackDescription:
      "Live backtest data could not be loaded. No sample run is being rendered in place of the API.",
    fallbackTitle: "Backtest unavailable",
    historyDescription: "Run a backtest first, then load recent runs to reuse persisted results.",
    historyTitle: "No stored history loaded",
    historyUnavailableDescription:
      "Recent persisted runs could not be loaded from the API during this request.",
    historyUnavailableTitle: "Backtest history unavailable",
    resultsDescription:
      "Generate or load a persisted backtest run to inspect walk-forward outcomes.",
    resultsTitle: "No backtest outcomes"
  },
  errorMessages: {
    historyUnavailable:
      "Backtest history is not available yet, so recent persisted runs cannot be loaded.",
    initialUnavailable:
      "Live backtest data could not be loaded from the API. No sample run is being shown in place of persisted results.",
    runUnavailable: "Backtest execution failed, so the current live run was left unchanged.",
    selectedRunUnavailable: "Unable to load the selected persisted backtest run."
  },
  filters: {
    summary:
      "The backtest runs against historical draws only. The selected window never looks forward into the target draw."
  },
  hero: {
    description:
      "Historical draws are replayed in order so the selected strategy only sees earlier data. Hit rate, miss streak, and ranking are shown as analysis output, not guarantees.",
    eyebrow: "Backtest",
    title: "Walk-forward strategy validation"
  },
  history: {
    description:
      "Load a previously saved run from PostgreSQL to compare its summary and result table.",
    eyebrow: "History",
    storedRunsLabel: "stored runs",
    tableHeaders: {
      action: "Action",
      computed: "Computed",
      coverage: "Coverage",
      hitRate: "Hit rate",
      strategy: "Strategy"
    },
    title: "Recent persisted runs"
  },
  metrics: {
    averageHitRank: "Average hit rank",
    candidates: "Candidates",
    computed: "Computed",
    coverage: "Coverage",
    currentCandidates: {
      hint: "How many generated candidates were tested per draw.",
      label: "Candidates"
    },
    currentHitRate: {
      hint: "Share of historical windows that produced at least one hit.",
      label: "Hit rate"
    },
    currentMissStreak: {
      hint: "Longest consecutive miss streak in the sampled run.",
      label: "Miss streak"
    },
    engineVersion: {
      hint: "Prediction engine version recorded in the backtest run.",
      label: "Engine version"
    },
    strategy: {
      hint: "Strategy registry entry used for scoring.",
      label: "Strategy"
    }
  },
  results: {
    description: "Each row reflects one target draw evaluated from the earlier window only.",
    eyebrow: "Results",
    statusLabels: {
      hit: "Hit",
      miss: "Miss"
    },
    tableHeaders: {
      actual: "Actual",
      draw: "Draw",
      generated: "Generated",
      hitRank: "Hit rank",
      status: "Status"
    },
    title: "Walk-forward outcomes"
  },
  sections: {
    currentRun: {
      eyebrow: "Run summary",
      title: "Current backtest"
    },
    runDetails: {
      description:
        "The contract exposes versioned scores so the UI can verify which engine produced the run.",
      eyebrow: "Run details",
      title: "Summary and verification"
    }
  },
  selectPlaceholders: {
    lotteryType: "Lottery type",
    prizeType: "Prize type",
    strategy: "Strategy"
  },
  strategyOptions: [
    { label: "Balanced", value: "balanced" },
    { label: "Hot trend", value: "hotTrend" },
    { label: "Cold rebound", value: "coldRebound" }
  ] satisfies ReadonlyArray<{ label: string; value: BacktestRequest["strategyId"] }>,
  prizeOptions: [
    { label: "Two digit", value: "TWO_DIGIT" },
    { label: "First", value: "FIRST" },
    { label: "Three digit", value: "THREE_DIGIT" },
    { label: "Three front", value: "THREE_FRONT" },
    { label: "Three back", value: "THREE_BACK" },
    { label: "Prize 2", value: "PRIZE2" },
    { label: "Prize 3", value: "PRIZE3" },
    { label: "Prize 4", value: "PRIZE4" },
    { label: "Prize 5", value: "PRIZE5" }
  ] satisfies ReadonlyArray<{ label: string; value: BacktestRequest["prizeType"] }>,
  chartTitle: "Hit sequence"
} as const;
