export const searchContent = {
  emptyState: {
    description: "The current search query returned no draw, prize, stat, or watchlist hits.",
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
    },
    watchlist: {
      eyebrow: "watchlist hits",
      title: "Matching watchlist items"
    }
  },
  hero: {
    description:
      "Search across persisted draws, prize rows, analytics snapshots, and watchlist notes from one grouped API read model.",
    eyebrow: "Search contract",
    title: "Cross-source search for historical lottery signals"
  },
  searchForm: {
    buttonLabel: "Search",
    placeholder: "Search by number, draw number, or note"
  }
} as const;

export type SearchContent = typeof searchContent;
