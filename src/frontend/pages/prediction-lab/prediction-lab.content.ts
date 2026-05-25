import { predictionPrizeOptions } from "@/lib/app/prediction";
import type { PredictionRequest } from "@/schema/app/prediction.schema";

export const predictionLabContent = {
  actions: {
    generate: "Generate"
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
    noPatternMatches: {
      description:
        "No generated candidates matched every selected pattern. Clear one or more patterns, or choose a different prize type.",
      title: "No candidates matched selected patterns"
    },
    noRun: {
      description:
        "No persisted prediction run is available yet. Generate candidates to inspect score breakdowns and reasons.",
      title: "No prediction run yet"
    },
    predictionError: {
      title: "Unable to generate predictions"
    }
  },
  errorMessages: {
    patternStatsUnavailable:
      "Pattern statistics could not be loaded for the selected prize type. Check analytics snapshots and API runtime.",
    predictionUnavailable:
      "Prediction API is unavailable or returned an invalid response. Check database seed data and API runtime."
  },
  hero: {
    description:
      "Strategies rank historical signals from analytics data. Select a prize to inspect independent position signals before combining a candidate.",
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
      "Results use independent position signals plus shape naturalness. Exact 6-digit repeats are not treated as a primary signal."
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
      eyebrow: "Generation flow",
      title: "Prediction settings"
    },
    patternPlayground: {
      clearAll: "Clear patterns",
      description:
        "Percentages use the same full eligible sample as the Patterns page. Selected patterns filter candidates before strategy ranking.",
      descriptionTh:
        "เปอร์เซ็นต์มาจาก sample เดียวกับหน้า Patterns เลือกหลาย pattern ได้ — ระบบจะกรองให้ตรงทุก pattern ก่อนจัด rank ด้วย strategy",
      eyebrow: "Pattern playground",
      patternsLink: "Open full Patterns page",
      title: "Pattern playground for prediction"
    }
  },
  selectPlaceholders: {
    prizeType: "Prize type",
    strategy: "Strategy"
  },
  prizeOptions: predictionPrizeOptions,
  strategyOptions: [
    { label: "Balanced", value: "balanced" },
    { label: "Hot trend", value: "hotTrend" },
    { label: "Cold rebound", value: "coldRebound" }
  ] satisfies ReadonlyArray<{ label: string; value: PredictionRequest["strategyId"] }>
} as const;
