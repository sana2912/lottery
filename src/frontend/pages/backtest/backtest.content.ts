import type { BacktestRequest } from "@/schema/app/backtest.schema";

export const backtestContent = {
  actions: {
    historyButton: "Load recent runs",
    loadLabel: "Load",
    methodologyHref: "/methodology#backtest-reading",
    methodologyLabel: "Read how walk-forward backtest is interpreted",
    resultsMethodologyLabel: "Review hit rate, miss streak, and rank guidance",
    runButton: "Run backtest",
    viewingLabel: "Viewing"
  },
  badges: {
    liveApi: "Live API",
    sampleRun: "Sample run"
  },
  emptyState: {
    historyDescription: "Run a backtest first, then load recent runs to reuse persisted results.",
    historyTitle: "No stored history loaded",
    fallbackTitle: "Backtest API fallback"
  },
  errorMessages: {
    historyUnavailable:
      "Backtest history is not available yet, so recent persisted runs cannot be loaded.",
    runUnavailable:
      "Backtest API is not available yet, so this view is showing the checked sample run.",
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
      label: "Candidates",
      hint: "How many generated candidates were tested per draw."
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
    { label: "Three front", value: "THREE_FRONT" },
    { label: "Three back", value: "THREE_BACK" }
  ] satisfies ReadonlyArray<{ label: string; value: BacktestRequest["prizeType"] }>,
  chartTitle: "Hit sequence"
} as const;
