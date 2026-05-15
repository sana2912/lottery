import { CalendarPage } from "@/frontend/pages/calendar";

export default async function CalendarRoute({
  searchParams
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  return <CalendarPage searchParams={searchParams ? await searchParams : undefined} />;
}
