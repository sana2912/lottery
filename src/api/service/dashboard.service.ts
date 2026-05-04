import { toApiDashboardReadModel } from "@/api/model/dto/dashboard.dto";
import { toApiDraw } from "@/api/model/dto/draw.dto";
import { analyticsService } from "@/api/service/analytics.service";
import { predictionService } from "@/api/service/prediction.service";
import { getPrisma } from "@/api/service/prisma";

const DASHBOARD_WINDOW_SIZE = 120;
const DASHBOARD_HERO = {
  description:
    "This dashboard summarizes the latest verified draw, live analytics signals, and prediction availability from the current database-backed services.",
  eyebrow: "Dashboard contract",
  primaryActionHref: "/results",
  primaryActionLabel: "Review historical results",
  title: "A single read model for the latest draw, live signals, and prediction summary"
} as const;

const DASHBOARD_CONTRACT_ROWS = [
  {
    field: "latestDraw",
    purpose: "Shows the newest persisted draw and the main prize groups surfaced on the dashboard.",
    source: "LotteryDraw + LotteryPrize"
  },
  {
    field: "metrics[]",
    purpose: "Summarizes sample size and the first signal cards users should notice immediately.",
    source: "computed analytics"
  },
  {
    field: "signals[]",
    purpose: "Shares the same signal vocabulary used by Analytics, Compare, and Prediction Lab.",
    source: "analytics read model"
  },
  {
    field: "predictionSummary",
    purpose:
      "Surfaces the latest persisted prediction candidates so the dashboard and Prediction Lab share one read source.",
    source: "prediction persistence read model"
  }
] as const;

export async function getDashboardReadModel() {
  const prisma = getPrisma();
  const generatedAt = new Date();
  const [latestDrawRecord, analytics, latestPredictionSummary] = await Promise.all([
    timeAsync("dashboard.latest draw query", () =>
      prisma.lotteryDraw.findFirst({
        include: {
          prizes: true
        },
        orderBy: {
          drawDate: "desc"
        },
        where: {
          drawDate: {
            lte: generatedAt
          }
        }
      })
    ),
    timeAsync("dashboard.analytics read model", () =>
      analyticsService.getAnalyticsReadModel({
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 2,
        page: 1,
        pageSize: 20,
        prizeType: "TWO_DIGIT",
        windowSize: DASHBOARD_WINDOW_SIZE
      })
    ),
    timeAsync("dashboard.prediction summary", () => predictionService.getLatestPredictionSummary())
  ]);

  const latestDraw = latestDrawRecord ? toApiDraw(latestDrawRecord) : undefined;
  const hotStat = analytics.numberStats.reduce((best, stat) => {
    if (!best) {
      return stat;
    }

    if (stat.frequencyPercent !== best.frequencyPercent) {
      return stat.frequencyPercent > best.frequencyPercent ? stat : best;
    }

    return stat.trendScore > best.trendScore ? stat : best;
  }, analytics.numberStats[0]);
  const coldStat = analytics.numberStats.reduce((best, stat) => {
    if (!best) {
      return stat;
    }

    if (stat.frequencyPercent !== best.frequencyPercent) {
      return stat.frequencyPercent < best.frequencyPercent ? stat : best;
    }

    return stat.missingDrawCount > best.missingDrawCount ? stat : best;
  }, analytics.numberStats[0]);
  const overdueStat = analytics.numberStats.reduce((best, stat) => {
    if (!best) {
      return stat;
    }

    if (stat.missingDrawCount !== best.missingDrawCount) {
      return stat.missingDrawCount > best.missingDrawCount ? stat : best;
    }

    return stat.frequencyPercent > best.frequencyPercent ? stat : best;
  }, analytics.numberStats[0]);

  return timeSync("dashboard.dto mapping", () =>
    toApiDashboardReadModel({
      contractRows: DASHBOARD_CONTRACT_ROWS.map((row) => ({ ...row })),
      generatedAt,
      hero: DASHBOARD_HERO,
      latestDraw: latestDraw
        ? {
            drawDate: latestDraw.drawDate,
            drawDateIso: latestDraw.drawDateIso,
            drawNo: latestDraw.drawNo || "-",
            id: latestDraw.id,
            lotteryType: latestDraw.lotteryType,
            primaryPrize: getPrimaryPrize(latestDraw.prizes),
            secondaryPrizes: getSecondaryPrizes(latestDraw.prizes),
            statusLabel: latestDraw.statusLabel
          }
        : {
            drawDate: "-",
            drawDateIso: "",
            drawNo: "-",
            id: "",
            lotteryType: "THAI_GOVERNMENT",
            primaryPrize: {
              label: "First prize",
              value: "-"
            },
            secondaryPrizes: [],
            statusLabel: "Unavailable"
          },
      metrics: [
        {
          hint: "Distinct draw records included in the current two-digit analytics window.",
          label: "Draws in sample",
          tone: "default",
          trend: `${DASHBOARD_WINDOW_SIZE} draw window`,
          value: String(analytics.summary.drawCount)
        },
        {
          hint: hotStat
            ? "Two-digit number with the strongest recent frequency in the current live sample."
            : "No live hot-number signal is available yet.",
          label: "Hot number",
          tone: "hot",
          trend: hotStat ? `${hotStat.frequencyPercent}%` : undefined,
          value: hotStat?.number ?? "-"
        },
        {
          hint: coldStat
            ? "Number currently appearing below the rest of the live sample baseline."
            : "No live cold-number signal is available yet.",
          label: "Cold number",
          tone: "cold",
          trend: coldStat ? `${coldStat.frequencyPercent}%` : undefined,
          value: coldStat?.number ?? "-"
        },
        {
          hint: overdueStat
            ? "Number missing longer than the rest of the current live sample."
            : "No live overdue-number signal is available yet.",
          label: "Overdue number",
          tone: "overdue",
          trend: overdueStat ? `${overdueStat.missingDrawCount} draws` : undefined,
          value: overdueStat?.number ?? "-"
        }
      ],
      predictionSummary: {
        candidates: latestPredictionSummary?.candidates ?? [],
        disclaimer:
          latestPredictionSummary?.disclaimer ??
          "A persisted prediction summary is not available through the dashboard read model yet. Use Prediction Lab for ad hoc generation and review.",
        generatedAt: latestPredictionSummary?.generatedAt ?? generatedAt.toISOString(),
        title: latestPredictionSummary?.title ?? "Prediction summary unavailable"
      },
      signals: [
        toSignal("hot", "Hot signal", hotStat),
        toSignal("overdue", "Overdue signal", overdueStat),
        toSignal("cold", "Cold signal", coldStat)
      ].flatMap((signal) => (signal ? [signal] : [])),
      source: "api"
    })
  );
}

export const dashboardService = {
  getDashboardReadModel
} as const;

function getPrimaryPrize(prizes: ReturnType<typeof toApiDraw>["prizes"]): {
  label: string;
  value: string;
} {
  const firstPrize = prizes.find((prize) => prize.type === "FIRST");

  if (!firstPrize) {
    return {
      label: "First prize",
      value: "-"
    };
  }

  return {
    label: firstPrize.label,
    value: firstPrize.number
  };
}

function getSecondaryPrizes(
  prizes: ReturnType<typeof toApiDraw>["prizes"]
): Array<{ label: string; value: string }> {
  const groupedPrizeTypes = ["THREE_FRONT", "THREE_BACK", "THREE_DIGIT", "TWO_DIGIT"];

  return groupedPrizeTypes.flatMap((type) => {
    const bucket = prizes.filter((prize) => prize.type === type);

    if (bucket.length === 0) {
      return [];
    }

    return [
      {
        label: bucket[0]?.label.replace(/ #\d+$/, "") ?? type,
        value: bucket.map((prize) => prize.number).join(", ")
      }
    ];
  });
}

function toSignal(
  tone: "cold" | "hot" | "overdue",
  label: string,
  stat:
    | undefined
    | {
        frequencyPercent: number;
        missingDrawCount: number;
        number: string;
      }
) {
  if (!stat) {
    return undefined;
  }

  const score =
    tone === "overdue"
      ? Math.min(100, stat.missingDrawCount * 4)
      : Math.round(stat.frequencyPercent);

  let reason = "Missing longer than neighboring numbers in the same evaluation window.";

  if (tone === "hot") {
    reason = "Repeated more often than the current two-digit sample average.";
  } else if (tone === "cold") {
    reason = "Appears less often than the rest of the current two-digit sample.";
  }

  return {
    id: `signal-${tone}-${stat.number}`,
    label,
    number: stat.number,
    reason,
    score,
    tone
  };
}

async function timeAsync<T>(label: string, operation: () => Promise<T>) {
  console.time(label);

  try {
    return await operation();
  } finally {
    console.timeEnd(label);
  }
}

function timeSync<T>(label: string, operation: () => T) {
  console.time(label);

  try {
    return operation();
  } finally {
    console.timeEnd(label);
  }
}
