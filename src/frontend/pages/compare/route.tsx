import { ComparePage } from "@/frontend/pages/compare";

export default async function CompareRoute({
  searchParams
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  return <ComparePage searchParams={await searchParams} />;
}
