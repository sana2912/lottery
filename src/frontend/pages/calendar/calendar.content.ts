export const calendarContent = {
  actions: {
    methodologyHref: "/methodology#monthly-insights",
    methodologyLabel: "Read how monthly insights should be interpreted",
    monthlyMethodologyLabel: "Review sample-size and uncertainty guidance"
  },
  badges: {
    liveApi: "Live API",
    mockFallback: "Mock fallback",
    nextDraw: "Next draw"
  },
  cards: {
    context: {
      description:
        "Calendar is the timing layer for the rest of the product. It does not predict outcomes by itself.",
      eyebrow: "Context",
      title: "How to read this page"
    },
    schedule: {
      description:
        "The next scheduled draw stays pinned at the top so users can orient around the next decision window.",
      eyebrow: "Schedule",
      title: "Upcoming and recent draw dates"
    }
  },
  emptyStates: {
    monthlyInsights: {
      description: "No monthly insight rows are available in the current calendar read model.",
      title: "No monthly insights"
    }
  },
  fallbackLabels: {
    coldNumbers: "Cold numbers",
    hotNumbers: "Hot numbers"
  },
  hero: {
    description:
      "Track the next scheduled draw, review recent dates, and scan monthly patterns from the historical record used by the rest of the dashboard.",
    eyebrow: "Calendar",
    title: "Draw rhythm and month-based signals"
  },
  metrics: {
    countdown: {
      hint: "Days remaining until the next scheduled draw date.",
      label: "Countdown",
      suffix: "days"
    },
    drawNumber: {
      hint: "Draw number label for the next scheduled run.",
      label: "Draw no."
    },
    generated: {
      hint: "Timestamp when the calendar read model was generated.",
      label: "Generated"
    },
    insightBasis: {
      hint: "Monthly notes summarize historical patterns from the same month only.",
      label: "Insight basis",
      value: "Month seasonality"
    },
    monthlyInsights: {
      hint: "Monthly seasonal summaries currently exposed by the calendar read model.",
      label: "Monthly insights"
    },
    scheduleRows: {
      hint: "Recent draw rows plus the upcoming scheduled draw.",
      label: "Schedule rows"
    },
    timingAnchor: {
      hint: "Calendar uses draw dates to anchor seasonality and timing windows.",
      label: "Timing anchor",
      value: "Draw date"
    }
  },
  monthlyInsights: {
    description:
      "These cards are descriptive cues for timing and context. They are not guarantees.",
    eyebrow: "Monthly insights",
    title: "Seasonal notes from the same month in prior draws"
  },
  nextDraw: {
    eyebrow: "Next draw"
  },
  scheduleTable: {
    headers: {
      date: "Date",
      drawNumber: "Draw no.",
      status: "Status"
    }
  }
} as const;
