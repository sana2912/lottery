import { ResultsPage } from "@/frontend/pages/results";

export default async function ResultsRoute({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ResultsPage searchParams={searchParams ? await searchParams : undefined} />;
}
