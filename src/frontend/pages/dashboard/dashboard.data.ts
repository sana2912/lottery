import dashboardMockJson from "@/frontend/pages/dashboard/dashboard.mock.json";
import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type DashboardReadModel, dashboardReadModelSchema } from "@/schema/app/dashboard.schema";

const dashboardShell = dashboardReadModelSchema.parse(dashboardMockJson);

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
