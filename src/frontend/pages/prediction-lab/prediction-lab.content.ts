import type { PredictionRequest } from "@/schema/app/prediction.schema";

export const predictionLabContent = {
  actions: {
    breakdownHref: "/methodology#score-breakdown",
    breakdownLabel: "Review score breakdown fields",
    generate: "Generate",
    methodologyHref: "/methodology#prediction-score",
    methodologyLabel: "Read how prediction scores are derived",
    saveToWatchlist: "Save to watchlist",
    savedToWatchlist: "Saved to global watchlist"
  },
  emptyStates: {
    loading: {
      description: "Loading the latest persisted prediction run from the live API.",
      title: "Loading prediction run"
    },
    noCandidates: {
      description:
        "The latest prediction run completed, but no candidates met the current historical criteria.",
      title: "No candidates in latest run"
    },
    noRun: {
      description:
        "No persisted prediction run is available yet. Generate candidates to inspect score breakdowns and reasons.",
      title: "No prediction run yet"
    },
    predictionError: {
      title: "Unable to generate predictions"
    },
    watchlistError: {
      title: "Watchlist save failed"
    }
  },
  errorMessages: {
    predictionUnavailable:
      "Prediction API is unavailable or returned an invalid response. Check database seed data and API runtime.",
    watchlistSaveFailed: "Unable to save this number to the global watchlist."
  },
  hero: {
    description:
      "Strategies rank historical signals from analytics data. Scores are analysis outputs, not guarantees.",
    eyebrow: "Prediction Lab",
    title: "Generate explainable number candidates"
  },
  metrics: {
    candidates: {
      hint: "Candidate count from the latest run.",
      label: "Candidates"
    },
    score: {
      hint: "Weighted signal score from the selected strategy.",
      label: "Score"
    },
    topScore: {
      hint: "Highest score from the latest generated result.",
      label: "Top score"
    }
  },
  notes: {
    resultSummary:
      "Results use historical analytics signals and should be read as exploratory ranking."
  },
  results: {
    rankLabel: "Rank",
    reasonsTitle: "Reasons",
    versionWindowLabel: "window"
  },
  sections: {
    currentResult: {
      eyebrow: "Run summary",
      title: "Current result"
    },
    generationSettings: {
      eyebrow: "Strategy input",
      title: "Generation settings"
    }
  },
  selectPlaceholders: {
    strategy: "Strategy"
  },
  strategyOptions: [
    { label: "Balanced", value: "balanced" },
    { label: "Hot trend", value: "hotTrend" },
    { label: "Cold rebound", value: "coldRebound" }
  ] satisfies ReadonlyArray<{ label: string; value: PredictionRequest["strategyId"] }>
} as const;
