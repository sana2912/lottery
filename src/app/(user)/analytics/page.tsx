import { analyticsService } from "@/api/service/analytics.service";
import { AnalyticsPage } from "@/frontend/pages/analytics";
import { analyticsShell } from "@/frontend/pages/analytics/analytics.data";
import { parseAnalyticsSearchParams } from "@/frontend/pages/analytics/analytics.query";

export default async function AnalyticsRoute({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const query = parseAnalyticsSearchParams(rawSearchParams);

  let pageData: { model: typeof analyticsShell; state: "ready" | "empty" | "error" };

  try {
    const model = await analyticsService.getAnalyticsReadModel(query);
    pageData = { model, state: model.numberStats.length > 0 ? "ready" : "empty" };
  } catch {
    pageData = { model: analyticsShell, state: "error" };
  }

  return <AnalyticsPage pageData={pageData} searchParams={rawSearchParams} />;
}
