import { SearchPage } from "@/frontend/pages/search";

export default async function SearchRoute({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <SearchPage searchParams={searchParams ? await searchParams : undefined} />;
}
