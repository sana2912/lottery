import { PatternsPage } from "@/frontend/pages/patterns";

export default async function PatternsRoute({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PatternsPage searchParams={searchParams ? await searchParams : undefined} />;
}
