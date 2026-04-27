import Link from "next/link";
import resultsMockJson from "@/frontend/pages/results/results.mock.json";
import {
  Badge,
  Button,
  Card,
  SectionHeading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/frontend/primitives";
import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type Draw,
  type DrawDetailResponse,
  drawDetailResponseSchema
} from "@/schema/app/draw.schema";
import { resultsReadModelSchema } from "@/schema/app/results.schema";

const resultsMock = resultsReadModelSchema.parse(resultsMockJson);

type ResultsDetailPageProps = {
  id: string;
};

export async function ResultsDetailPage({ id }: ResultsDetailPageProps) {
  const draw = await getDrawDetail(id);

  if (!draw) {
    return (
      <main className="space-y-6">
        <Card className="p-6">
          <SectionHeading eyebrow="Draw detail" title="Draw not found" />
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
            No draw record matched this identifier.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/results">Back to Results</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/results">Back to Results</Link>
          </Button>

          <p className="mt-6 text-sm font-semibold text-[var(--color-brand-outline)]">
            {draw.drawDate}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            Draw {draw.drawNo || draw.id}
          </h1>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant={draw.status === "complete" ? "success" : "warning"}>
              {draw.statusLabel}
            </Badge>
            <Badge variant="neutral">{draw.coverage}</Badge>
            <Badge variant="neutral">{draw.lotteryType}</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Contract fields" title="API shape" />
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-[var(--color-text-muted)]">ID</dt>
              <dd className="mt-1 break-all text-[var(--color-text-primary)]">{draw.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--color-text-muted)]">Draw date ISO</dt>
              <dd className="mt-1 text-[var(--color-text-primary)]">{draw.drawDateIso}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--color-text-muted)]">Prize rows</dt>
              <dd className="mt-1 text-[var(--color-text-primary)]">{draw.prizes.length}</dd>
            </div>
          </dl>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading eyebrow="Prizes" title="Prize records in this draw" />
        <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
          <Table>
            <TableHeader className="bg-[var(--color-bg-subtle)]">
              <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Prize
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Type
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Number
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draw.prizes.map((prize) => (
                <TableRow
                  className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                  key={prize.id}
                >
                  <TableCell className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                    {prize.label}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {prize.type}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                    {prize.number}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </main>
  );
}

async function getDrawDetail(id: string): Promise<Draw | null> {
  try {
    const response = await apiGet<DrawDetailResponse>(`${apiRoutes.draws}/${id}`, {
      cache: "no-store",
      schema: drawDetailResponseSchema
    });

    return response.draw;
  } catch {
    return getMockDraw(id);
  }
}

function getMockDraw(id: string): Draw | null {
  const draw = resultsMock.draws.find((item) => item.id === id);

  if (!draw) {
    return null;
  }

  return {
    coverage: draw.coverage,
    drawDate: draw.drawDate,
    drawDateIso: draw.drawDateIso,
    drawNo: draw.drawNo,
    id: draw.id,
    lotteryType: draw.lotteryType,
    prizes: draw.prizes.map((prize, index) => ({
      id: `${draw.id}-${prize.prizeType}-${index}`,
      label: prize.label,
      number: prize.value,
      type: prize.prizeType
    })),
    status: draw.status,
    statusLabel: draw.statusLabel
  };
}
