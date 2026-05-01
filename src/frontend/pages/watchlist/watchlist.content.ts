import type { WatchlistSource } from "@/schema/app/watchlist.schema";

export const watchlistContent = {
  actions: {
    addButton: "Add to global watchlist",
    cancel: "Cancel",
    saveChanges: "Save changes"
  },
  emptyStates: {
    empty: {
      description: "Add a number manually or save a generated candidate from Prediction Lab.",
      title: "No watchlist items"
    },
    error: {
      title: "Watchlist error"
    },
    loading: "Loading watchlist records..."
  },
  errorMessages: {
    addFailed: "Unable to add this number to the global watchlist.",
    deleteFailed: "Unable to delete this watchlist item.",
    loadFailed: "Unable to load the global watchlist.",
    updateFailed: "Unable to update this watchlist item."
  },
  fields: {
    note: {
      label: "Note",
      placeholder: "Why this number is being watched"
    },
    number: {
      label: "Number",
      placeholder: "09"
    },
    source: {
      label: "Source",
      placeholder: "Select source"
    },
    startEditAriaLabel: "Edit",
    tags: {
      label: "Tags",
      placeholder: "manual, family"
    }
  },
  hero: {
    description:
      "This watchlist is shared globally because authentication is not enabled yet. Future auth work will scope saved numbers by user.",
    eyebrow: "Global Watchlist",
    title: "Saved numbers for the current MVP workspace"
  },
  metrics: {
    savedNumbers: {
      hint: "Items currently returned from /api/watchlist.",
      label: "Saved numbers"
    },
    statCoverage: {
      hint: "Watchlist items currently enriched with live historical stats.",
      label: "Enriched items"
    },
    scope: {
      hint: "Temporary no-auth ownership mode.",
      label: "Scope"
    }
  },
  statSummary: {
    frequencyLabel: "Frequency",
    hitsLabel: "Hits",
    lastSeenLabel: "Last seen",
    missingLabel: "Missing",
    prizeTypeLabel: "Prize type",
    unavailable: "No historical stat summary is available for this number yet."
  },
  sections: {
    addNumber: {
      description:
        "Watchlist edits are still global until authentication introduces user ownership.",
      eyebrow: "Add number",
      title: "Manual watchlist entry"
    },
    scope: {
      eyebrow: "Scope",
      title: "Global preset"
    }
  },
  sourceOptions: ["MANUAL", "NOTEBOOK", "PREDICTION"] satisfies readonly WatchlistSource[],
  updatedLabel: "Updated"
} as const;
