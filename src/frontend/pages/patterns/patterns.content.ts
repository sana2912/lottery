export const patternsContent = {
  charts: {
    heatmapTitle: "Pattern heatmap"
  },
  emptyState: {
    description: "Pattern summaries will appear after number stats are available.",
    title: "No pattern records"
  },
  hero: {
    description:
      "Odd/even, high/low, doubles, mirrors, and sequences are summarized as descriptive patterns from past draw records.",
    eyebrow: "Patterns",
    title: "Repeating shapes in historical numbers"
  },
  metrics: {
    flaggedNumbers: {
      hint: "Number groups carrying one or more pattern flags.",
      label: "Flagged numbers"
    },
    patterns: {
      hint: "Pattern groups with at least one matching number.",
      label: "Patterns"
    }
  },
  sample: {
    eyebrow: "Sample",
    title: "Pattern coverage"
  },
  sections: {
    flaggedNumbers: {
      eyebrow: "Flagged numbers",
      title: "Numbers grouped by pattern flags"
    },
    patternSummaries: {
      eyebrow: "Pattern summaries",
      hitsLabel: "hits from",
      title: "Historical shape notes",
      trackedGroupsLabel: "tracked number groups"
    }
  }
} as const;
