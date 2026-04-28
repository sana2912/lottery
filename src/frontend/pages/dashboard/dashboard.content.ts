export const dashboardContent = {
  contractTableHeaders: {
    field: "field",
    purpose: "purpose",
    source: "source"
  },
  latestDraw: {
    calendarActionLabel: "View draw calendar",
    detailActionLabel: "Open draw detail",
    drawLabel: "Draw",
    eyebrow: "Latest draw"
  },
  metricLinks: {
    "Cold number": {
      href: "/analytics",
      label: "Open Analytics"
    },
    "Draws in sample": {
      href: "/results",
      label: "Open Results"
    },
    "Hot number": {
      href: "/analytics",
      label: "Open Analytics"
    },
    "Overdue number": {
      href: "/methodology#score-breakdown",
      label: "Read Methodology"
    }
  },
  predictionSummary: {
    actions: {
      detailHref: "/prediction-lab",
      detailLabel: "Open Prediction Lab",
      methodologyHref: "/methodology#prediction-score",
      methodologyLabel: "How to read the score"
    },
    eyebrow: "prediction summary",
    scoreLabel: "score"
  },
  readModel: {
    actionHref: "/results",
    actionLabel: "Open Results contract surface",
    description:
      "These fields define the dashboard shape expected from the service layer so Prisma-backed and computed analytics data can map into one stable API response.",
    eyebrow: "read model",
    title: "Dashboard read model contract"
  },
  signals: {
    actions: {
      detailHref: "/analytics",
      detailLabel: "Open Analytics",
      methodologyHref: "/methodology#score-breakdown",
      methodologyLabel: "How signals are scored"
    },
    eyebrow: "signal board",
    title: "Signals surfaced from the current analytics model"
  },
  shared: {
    defaultActionLabel: "Open"
  }
} as const;
