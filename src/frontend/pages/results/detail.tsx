import Link from "next/link";
import { resultsContent } from "@/frontend/pages/results/results.content";
import { getDrawDetail } from "@/frontend/pages/results/results.data";
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

type ResultsDetailPageProps = {
  id: string;
};

export async function ResultsDetailPage({ id }: ResultsDetailPageProps) {
  const draw = await getDrawDetail(id);

  if (!draw) {
    return (
      <main className="space-y-6">
        <Card className="p-6">
          <SectionHeading
            eyebrow={resultsContent.detail.emptyEyebrow}
            title={resultsContent.detail.emptyTitle}
          />
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
            {resultsContent.detail.emptyDescription}
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/results">{resultsContent.detail.backLabel}</Link>
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
            <Link href="/results">{resultsContent.detail.backLabel}</Link>
          </Button>

          <p className="mt-6 text-sm font-semibold text-[var(--color-brand-outline)]">
            {draw.drawDate}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {resultsContent.detail.drawLabel} {draw.drawNo || draw.id}
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
          <SectionHeading
            eyebrow={resultsContent.detail.contractEyebrow}
            title={resultsContent.detail.contractTitle}
          />
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-[var(--color-text-muted)]">
                {resultsContent.detail.fields.id}
              </dt>
              <dd className="mt-1 break-all text-[var(--color-text-primary)]">{draw.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--color-text-muted)]">
                {resultsContent.detail.fields.drawDateIso}
              </dt>
              <dd className="mt-1 text-[var(--color-text-primary)]">{draw.drawDateIso}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--color-text-muted)]">
                {resultsContent.detail.fields.prizeRows}
              </dt>
              <dd className="mt-1 text-[var(--color-text-primary)]">{draw.prizes.length}</dd>
            </div>
          </dl>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow={resultsContent.detail.prizesEyebrow}
          title={resultsContent.detail.prizesTitle}
        />
        <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
          <Table>
            <TableHeader className="bg-[var(--color-bg-subtle)]">
              <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {resultsContent.detail.prizesTableHeaders.label}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {resultsContent.detail.prizesTableHeaders.type}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {resultsContent.detail.prizesTableHeaders.number}
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
