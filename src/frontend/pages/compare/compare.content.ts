import type { CompareRequest } from "@/schema/app/compare.schema";

export const compareContent = {
  actions: {
    button: "Compare numbers",
    methodologyHref: "/methodology#score-breakdown",
    methodologyLabel: "Read how compare scores are explained",
    rankingMethodologyLabel: "Review the shared scoring fields"
  },
  badges: {
    liveApi: "Live API",
    rankLabel: "Rank",
    sampleSet: "Sample set"
  },
  chartTitle: "Score comparison",
  emptyState: {
    fallbackTitle: "Compare API fallback"
  },
  errorMessage: "Compare API is not available yet, so this view is showing the checked sample set.",
  filters: {
    summary:
      "Compare uses the same scoring engine as Prediction Lab, so the result is aligned with one contract across the product."
  },
  hero: {
    description:
      "Compare ranks candidate numbers against the same historical analytics signals so the strongest score is easy to inspect. The output explains historical support, not a win guarantee.",
    eyebrow: "Compare",
    title: "Side-by-side number scoring"
  },
  metrics: {
    candidates: {
      hint: "How many candidate numbers were compared.",
      label: "Candidates"
    },
    generated: "Generated",
    sampleSize: "Sample size",
    strongestSignal: "Strongest signal",
    topRank: "Top rank",
    topScore: {
      hint: "Highest score in the current candidate set.",
      label: "Top score"
    }
  },
  sections: {
    currentRun: {
      eyebrow: "Run summary",
      title: "Current compare"
    },
    explainableRanking: {
      description:
        "The score breakdown keeps the output readable for product review and later strategy tuning.",
      eyebrow: "Explainable ranking",
      title: "Why the leading numbers scored higher"
    },
    results: {
      description:
        "The table exposes each score breakdown so the same scoring model can be audited across candidates.",
      eyebrow: "Table",
      tableHeaders: {
        breakdown: "Breakdown",
        number: "Number",
        rank: "Rank",
        reasons: "Reasons",
        score: "Score"
      },
      title: "Compare results"
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
  ] satisfies ReadonlyArray<{ label: string; value: CompareRequest["strategyId"] }>,
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
  ] satisfies ReadonlyArray<{ label: string; value: CompareRequest["prizeType"] }>
} as const;
