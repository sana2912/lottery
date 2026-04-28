export const methodologyContent = {
  backtestReading: {
    cards: {
      hitRateVersusRank: {
        body: "Hit rate answers whether a generated set included an actual hit. Average hit rank answers how early that hit appeared inside the candidate ordering. They measure different qualities and should not be merged into one conclusion.",
        title: "Hit rate versus rank"
      },
      walkForwardRule: {
        body: "For each evaluated draw, the engine slices a historical window that ends before the target draw. That prevents data leakage from future outcomes.",
        title: "Walk-forward rule"
      },
      whatMattersMost: {
        body: "Read hit rate together with coverage and longest miss streak. A run with a moderate hit rate but a severe miss streak can still be difficult to trust operationally.",
        title: "What matters most"
      }
    },
    description:
      "Backtest replays draws in chronological order so each target draw only sees earlier data.",
    eyebrow: "Backtest",
    title: "How to read walk-forward backtest results"
  },
  glossary: {
    description: "These terms appear repeatedly in filters, score cards, and tables.",
    eyebrow: "Glossary",
    items: [
      {
        detail:
          "How many historical draws are visible to analytics, compare, prediction, and backtest runs.",
        term: "Window size"
      },
      {
        detail:
          "How many eligible historical rows contributed to a summary, comparison, or month insight.",
        term: "Sample size"
      },
      {
        detail:
          "Share of evaluated draws where a generated set contained at least one actual winning number.",
        term: "Hit rate"
      },
      {
        detail:
          "Largest run of consecutive evaluated draws with no hit inside the generated candidate set.",
        term: "Longest miss streak"
      }
    ],
    title: "Core terms used across the MVP"
  },
  hero: {
    description:
      "This page explains how scores, seasonal notes, and backtest summaries are derived so the product stays readable and auditable. Every metric here should be interpreted as historical analysis, not a promise about a future draw.",
    eyebrow: "Methodology",
    title: "How this dashboard turns history into explainable signals",
    warning:
      "Scores rank historical support inside a chosen context. They do not estimate true winning probability and they do not remove chance from lottery outcomes."
  },
  limitations: {
    description: "These boundaries should stay visible wherever scores or seasonality are shown.",
    eyebrow: "Limits",
    items: [
      "The dashboard does not estimate true winning odds and does not guarantee future outcomes.",
      "Strategy scores depend on the chosen prize type, number length, date range, and window size. Changing context can change ranking materially.",
      "Historical patterns can disappear. Use this product as a research aid, not as evidence that chance has been removed from the lottery."
    ],
    linkHref: "#prediction-score",
    linkLabel: "Revisit the score sections",
    title: "What this MVP does not claim"
  },
  monthlyInsights: {
    cards: {
      recommendedUse: {
        body: "Use Calendar to frame timing and seasonality, then confirm numbers through Analytics, Compare, or Backtest instead of reading the monthly card alone.",
        title: "Recommended use"
      },
      sampleSizeRule: {
        body: "A monthly pattern with 10 or 12 rows is descriptive context only. Small samples can swing quickly and should not be treated as stable evidence.",
        title: "Sample-size rule"
      },
      scopeRule: {
        body: "Hot and cold numbers in Calendar are seasonality hints. They are not direct substitutes for the main analytics views, which use broader configurable windows.",
        title: "Scope rule"
      }
    },
    description: "Monthly insight cards summarize historical draws from the same month only.",
    eyebrow: "Calendar",
    title: "How monthly insights should be read"
  },
  pageLinks: {
    description:
      "Use the same sections linked from Prediction Lab, Backtest, Compare, and Calendar.",
    eyebrow: "Quick links",
    items: [
      { href: "#prediction-score", label: "Prediction score" },
      { href: "#score-breakdown", label: "Score breakdown" },
      { href: "#backtest-reading", label: "Backtest reading guide" },
      { href: "#monthly-insights", label: "Monthly insights" },
      { href: "#limitations", label: "Limits and disclaimers" }
    ],
    title: "Jump to a topic"
  },
  predictionScore: {
    cards: {
      example: {
        body: "A number can rank highly because it is both frequent in the selected window and overdue relative to its recent absence, while another number can lead mainly because a strategy favors hot trend over gap recovery.",
        title: "Example"
      },
      flow: {
        body: "Results history becomes analytics stats. A strategy then weights those stats into a single score and emits reasons so each candidate remains inspectable.",
        title: "Flow"
      },
      interpretation: {
        body: "Higher score means stronger support inside the selected historical context. It does not mean the number is expected to win in the next draw.",
        title: "Interpretation rule"
      }
    },
    description:
      "Prediction Lab reuses analytics number stats and applies a selected strategy weight profile.",
    eyebrow: "Prediction",
    title: "How to read Prediction Lab output"
  },
  scoreBreakdown: {
    description:
      "Prediction Lab and Compare share the same scoring contract, so these labels mean the same thing in both pages.",
    eyebrow: "Scoring",
    rows: [
      {
        id: "hot",
        label: "Hot",
        note: "Rewards numbers that appear more frequently inside the selected historical window.",
        variant: "hot" as const
      },
      {
        id: "overdue",
        label: "Overdue",
        note: "Rewards numbers that have stayed absent for longer than their recent baseline.",
        variant: "overdue" as const
      },
      {
        id: "position",
        label: "Position",
        note: "Reflects trend support from the underlying frequency and recency calculations.",
        variant: "brand" as const
      },
      {
        id: "pattern",
        label: "Pattern",
        note: "Adds weight when the number matches tracked pattern flags such as odd, high, or double.",
        variant: "prediction" as const
      },
      {
        id: "pair",
        label: "Pair",
        note: "Adds weight for repeated-digit or pair structure that the selected strategy values.",
        variant: "backtest" as const
      }
    ],
    title: "Score breakdown fields"
  }
} as const;
