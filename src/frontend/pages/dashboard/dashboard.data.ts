import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type DashboardReadModel, dashboardReadModelSchema } from "@/schema/app/dashboard.schema";

const dashboardShell: DashboardReadModel = dashboardReadModelSchema.parse({
  contractRows: [
    {
      field: "latestDraw",
      purpose:
        "Shows the newest persisted draw and the main prize groups surfaced on the dashboard.",
      source: "LotteryDraw + LotteryPrize"
    },
    {
      field: "metrics[]",
      purpose: "Summarizes draw count and the first signal cards users should notice immediately.",
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
        "Surfaces candidate numbers, scores, and reasons without embedding scoring logic in the page.",
      source: "prediction service"
    }
  ],
  generatedAt: new Date().toISOString(),
  hero: {
    description:
      "This read model is the contract for the newest draw, dashboard metrics, signals, and prediction summary.",
    eyebrow: "Dashboard",
    primaryActionHref: "/results",
    primaryActionLabel: "Review historical results",
    title: "Lottery dashboard"
  },
  latestDraw: {
    drawDate: "-",
    drawDateIso: "",
    drawNo: "-",
    id: "",
    lotteryType: "THAI_GOVERNMENT",
    primaryPrize: {
      label: "1st prize",
      value: "-"
    },
    secondaryPrizes: [],
    statusLabel: "-"
  },
  metrics: [
    {
      hint: "Count of historical draws available for analysis.",
      label: "Draws in sample",
      tone: "default",
      value: "0"
    },
    {
      hint: "Number appearing more often than baseline in the current window.",
      label: "Hot number",
      tone: "hot",
      value: "-"
    },
    {
      hint: "Number appearing less often than baseline in the current window.",
      label: "Cold number",
      tone: "cold",
      value: "-"
    },
    {
      hint: "Number missing longer than the typical gap observed in the current window.",
      label: "Overdue number",
      tone: "overdue",
      value: "-"
    }
  ],
  predictionSummary: {
    candidates: [],
    disclaimer:
      "Dashboard data could not be loaded from the live API. No mock dashboard summary is being shown in place of live data.",
    generatedAt: new Date().toISOString(),
    title: "Dashboard data unavailable"
  },
  signals: [],
  source: "mock"
});

export type DashboardPageData =
  | { model: DashboardReadModel; state: "error" }
  | { model: DashboardReadModel; state: "ready" }
  | { model: DashboardReadModel; state: "empty" };

export async function getDashboardPageData(): Promise<DashboardPageData> {
  try {
    const model = await apiGet<DashboardReadModel>(apiRoutes.dashboard, {
      cache: "no-store",
      schema: dashboardReadModelSchema
    });

    return {
      model,
      state: model.latestDraw.id ? "ready" : "empty"
    };
  } catch {
    return {
      model: {
        ...dashboardShell,
        generatedAt: new Date().toISOString(),
        latestDraw: {
          ...dashboardShell.latestDraw,
          drawDate: "-",
          drawDateIso: "",
          drawNo: "-",
          id: "",
          primaryPrize: {
            ...dashboardShell.latestDraw.primaryPrize,
            value: "-"
          },
          secondaryPrizes: []
        },
        metrics: dashboardShell.metrics.map((metric, index) => ({
          ...metric,
          trend: undefined,
          value: index === 0 ? "0" : "-"
        })),
        predictionSummary: {
          ...dashboardShell.predictionSummary,
          candidates: [],
          disclaimer:
            "Dashboard data could not be loaded from the live API. No mock dashboard summary is being shown in place of live data.",
          title: "Dashboard data unavailable"
        },
        signals: [],
        source: "mock"
      },
      state: "error"
    };
  }
}
