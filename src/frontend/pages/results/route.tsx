import { ResultsPage } from "@/frontend/pages/results";

export default async function ResultsRoute({
  searchParams
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  return <ResultsPage searchParams={await searchParams} />;
}
