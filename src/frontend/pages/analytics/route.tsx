import { AnalyticsPage } from "@/frontend/pages/analytics";

export default async function AnalyticsRoute({
  searchParams
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  return <AnalyticsPage searchParams={await searchParams} />;
}
