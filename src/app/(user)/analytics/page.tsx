import { AnalyticsPage } from "@/frontend/pages/analytics";

export default async function AnalyticsRoute({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AnalyticsPage searchParams={searchParams ? await searchParams : undefined} />;
}
