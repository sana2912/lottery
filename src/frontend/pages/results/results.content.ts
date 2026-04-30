export const resultsContent = {
  contractTableHeaders: {
    field: "field",
    purpose: "purpose",
    source: "source"
  },
  detail: {
    backLabel: "Back to Results",
    contractEyebrow: "Contract fields",
    contractTitle: "API shape",
    drawLabel: "Draw",
    emptyDescription: "No draw record matched this identifier.",
    emptyEyebrow: "Draw detail",
    emptyTitle: "Draw not found",
    errorDescription:
      "The draw detail service could not be reached or returned an invalid response. Check the API and database connection, then reload this page.",
    errorEyebrow: "Draw detail",
    errorTitle: "Draw detail unavailable",
    fields: {
      drawDateIso: "Draw date ISO",
      id: "ID",
      prizeRows: "Prize rows"
    },
    prizesEyebrow: "Prizes",
    prizesTableHeaders: {
      label: "Prize",
      number: "Number",
      type: "Type"
    },
    prizesTitle: "Prize records in this draw"
  },
  emptyState: {
    description: "The draw API returned an empty result set for the current filters.",
    title: "No draw records"
  },
  errorState: {
    description:
      "The draw service could not be reached or returned an invalid response. Check the API and database connection, then reload this page.",
    title: "Draw data unavailable"
  },
  fallbackNotes: {
    empty:
      "The /api/draws contract returned no draws for the current query. Seed or broaden the filter range before using downstream analysis screens.",
    error:
      "This screen could not load /api/draws. No mock records are being rendered in place of live data.",
    ready: "This screen is rendering from the /api/draws contract backed by the database."
  },
  filters: {
    allPrizeTypesLabel: "All prize types",
    detailLabel: "Detail",
    lotteryTypePlaceholder: "Select lottery type",
    prizeTypePlaceholder: "Select prize type",
    sectionEyebrow: "search and filter",
    sectionTitle: "Recent historical draws",
    searchPlaceholder: "Search by draw date or winning number"
  },
  heroActions: {
    contractLabel: "Review data contract",
    latestLabel: "View latest draw"
  },
  sidebar: {
    contractEyebrow: "backend contract fields",
    noteEyebrow: "team note",
    noteTitle: "Data source note",
    paragraphs: [
      "This screen forces the first stable read model for historical draws before deeper ingestion work begins. It locks the displayed date, draw number, grouped prize values, and data coverage status in one place.",
      "Once that shape is stable, the /api/draws service can map Prisma data into the same contract with less risk of frontend churn."
    ],
    title: "Results defines the base shape for historical draw data",
    whyEyebrow: "why this page matters"
  },
  stats: {
    latestDrawHint: "Latest draw returned by the draw service contract.",
    latestDrawLabel: "Latest draw",
    prizeRecordsHint: "Prize rows returned in the current page.",
    prizeRecordsLabel: "Prize records",
    drawRecordsHint: "Draw count from the current API query.",
    drawRecordsLabel: "Draw records"
  }
} as const;

export type ResultsContent = typeof resultsContent;
