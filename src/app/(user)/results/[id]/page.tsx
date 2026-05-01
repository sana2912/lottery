import { ResultsDetailPage } from "@/frontend/pages/results/detail";

type ResultsDetailRouteProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ResultsDetailRoute({ params }: ResultsDetailRouteProps) {
  const { id } = await params;

  return <ResultsDetailPage id={id} />;
}
