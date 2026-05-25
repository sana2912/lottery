export const calendarContent = {
  badges: {
    liveApi: "Live API",
    unavailable: "Unavailable",
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
    calendar: {
      description: "The calendar API returned no draw schedule rows for the current dataset.",
      title: "No calendar rows"
    },
    calendarError: {
      description:
        "The calendar service could not be reached or returned an invalid response. Check the API and database connection, then reload this page.",
      title: "Calendar data unavailable"
    },
    monthlyInsights: {
      description:
        "No heatmap rows are available for the selected month, prize type, and sample scope.",
      title: "No heatmap data"
    }
  },
  fallbackLabels: {
    coldNumbers: "Cold numbers",
    hotNumbers: "Hot numbers"
  },
  hero: {
    description:
      "Track the next scheduled draw, review recent dates, and scan digit heatmaps from the historical record used by the rest of the dashboard.",
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
      "Each cell shows how often a digit appeared at that position across all prize numbers in the selected draws. Colors rank digits within the row only—not win odds.",
    eyebrow: "Monthly heatmap",
    title: "Digit heatmap by position"
  },
  filters: {
    description: "All months in history, or one calendar month across every year, plus prize type.",
    eyebrow: "Heatmap controls",
    title: "Choose the sample",
    month: {
      label: "Month",
      placeholder: "Month"
    },
    year: {
      label: "Year",
      placeholder: "Year"
    },
    prizeType: {
      label: "Prize type",
      placeholder: "Prize type"
    },
    windowSize: {
      label: "Sample size",
      placeholder: "Sample size"
    }
  },
  heatmap: {
    cellHitRate: "Hit rate",
    cellHits: "Hits",
    legend: {
      cold: "Cold (lowest in row)",
      hitFrom: "Hits / opportunities",
      hitRate: "Hit rate %",
      hot: "Hot (highest in row)",
      relativeColor: "Colors are relative within each position row"
    },
    partialDataBadge: "Incomplete prize rows",
    partialDataNote:
      "This sample has fewer prize rows per draw than the standard catalog count. Hit rates use actual rows only.",
    sampleContext: "{drawCount} draws × ~{prizesPerDraw} prizes/draw",
    title: "Heatmap details"
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
