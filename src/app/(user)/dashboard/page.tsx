import { dashboardService } from "@/api/service/dashboard.service";
import { DashboardPage } from "@/frontend/pages/dashboard";
import { dashboardShell } from "@/frontend/pages/dashboard/dashboard.data";

export default async function DashboardRoute() {
  let pageData: { model: typeof dashboardShell; state: "ready" | "empty" | "error" };

  try {
    const model = await dashboardService.getDashboardReadModel();
    pageData = { model, state: model.latestDraw.id ? "ready" : "empty" };
  } catch {
    pageData = { model: dashboardShell, state: "error" };
  }

  return <DashboardPage pageData={pageData} />;
}
