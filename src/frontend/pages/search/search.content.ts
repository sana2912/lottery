export const searchContent = {
  emptyState: {
    description: "The current search query returned no draw, prize, or stat hits.",
    title: "No search matches"
  },
  errorState: {
    description:
      "The search service could not be reached or returned an invalid payload. Check the API and database connection, then reload this page.",
    title: "Search unavailable"
  },
  groups: {
    draws: {
      eyebrow: "draw hits",
      title: "Matching draws"
    },
    prizes: {
      eyebrow: "prize hits",
      title: "Matching prize numbers"
    },
    stats: {
      eyebrow: "stat hits",
      title: "Matching analytics groups"
    }
  },
  hero: {
    description:
      "Search across persisted draws, prize rows, and analytics snapshots from one grouped API read model.",
    eyebrow: "Search contract",
    title: "Cross-source search for historical lottery signals"
  },
  searchForm: {
    buttonLabel: "Search",
    placeholder: "Search by number or draw number"
  }
} as const;

export type SearchContent = typeof searchContent;
