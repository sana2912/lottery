import Link from "next/link";
import { MetricCard } from "@/frontend/components/cards/MetricCard";
import dashboardMockJson from "@/frontend/pages/dashboard/dashboard.mock.json";
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
import { dashboardReadModelSchema } from "@/schema/app/dashboard.schema";

const dashboardMock = dashboardReadModelSchema.parse(dashboardMockJson);

const metricLinks = {
  "Cold number": {
    href: "/analytics",
    label: "Open Analytics"
  },
  "Draws in sample": {
    href: "/results",
    label: "Open Results"
  },
  "Hot number": {
    href: "/analytics",
    label: "Open Analytics"
  },
  "Overdue number": {
    href: "/methodology#score-breakdown",
    label: "Read Methodology"
  }
} as const;

export function DashboardPage() {
  const { contractRows, hero, latestDraw, metrics, predictionSummary, signals } = dashboardMock;

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <Card className="bg-[image:var(--color-bg-hero-accent),var(--color-bg-hero)] p-6 md:p-8">
          <Badge variant="brand">{hero.eyebrow}</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)] md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {hero.description}
          </p>
          <Button
            asChild
            className="mt-8 rounded-none bg-[var(--color-brand)] px-4 py-[13px] text-[var(--primary-foreground)] hover:bg-[var(--color-brand-strong)]"
          >
            <Link href={hero.primaryActionHref}>{hero.primaryActionLabel}</Link>
          </Button>
        </Card>

        <Card className="bg-[var(--color-bg-dark)] p-6 text-[var(--color-text-inverse)]">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-text-inverse-soft)]">
            Latest draw
          </p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-normal">{latestDraw.drawDate}</p>
              <p className="mt-1 text-sm text-[var(--color-text-inverse-soft)]">
                Draw {latestDraw.drawNo}
              </p>
            </div>
            <Badge variant="success">{latestDraw.statusLabel}</Badge>
          </div>
          <div className="mt-6 rounded-none bg-[var(--color-bg-dark-soft)] p-4">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-inverse-soft)]">
              {latestDraw.primaryPrize.label}
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-normal">
              {latestDraw.primaryPrize.value}
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {latestDraw.secondaryPrizes.map((prize) => (
              <div
                className="flex items-center justify-between gap-4 border-b border-[var(--color-border-inverse-soft)] pb-3 last:border-b-0 last:pb-0"
                key={prize.label}
              >
                <span className="text-sm text-[var(--color-text-inverse-soft)]">{prize.label}</span>
                <span className="font-mono text-sm font-semibold text-[var(--color-text-inverse)]">
                  {prize.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--color-border-inverse-soft)] pt-4">
            <Button asChild size="sm" variant="secondary">
              <Link href={`/results/${latestDraw.id}`}>Open draw detail</Link>
            </Button>
            <Button
              asChild
              className="border-[var(--color-border-inverse-softer)] bg-transparent text-[var(--color-text-inverse)] hover:bg-[var(--color-bg-dark-softer)]"
              size="sm"
              variant="outline"
            >
              <Link href="/calendar">View draw calendar</Link>
            </Button>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            aria-label={`${metricLinks[metric.label as keyof typeof metricLinks]?.label ?? "Open"} for ${metric.label}`}
            className="block"
            href={metricLinks[metric.label as keyof typeof metricLinks]?.href ?? "/dashboard"}
            key={metric.label}
          >
            <MetricCard
              hint={metric.hint}
              label={metric.label}
              tone={metric.tone}
              trend={metric.trend}
              value={metric.value}
            />
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-6">
          <SectionHeading
            actions={
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/analytics">Open Analytics</Link>
                </Button>
                <Button asChild size="sm" variant="link">
                  <Link href="/methodology#score-breakdown">How signals are scored</Link>
                </Button>
              </div>
            }
            eyebrow="signal board"
            title="Signals surfaced from the current analytics model"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {signals.map((signal) => (
              <article
                className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5"
                key={signal.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge
                    variant={
                      signal.tone === "hot" ? "hot" : signal.tone === "cold" ? "cold" : "overdue"
                    }
                  >
                    {signal.label}
                  </Badge>
                  <span className="text-sm font-bold text-[var(--color-text-muted)]">
                    {signal.score}
                  </span>
                </div>
                <p className="mt-5 font-mono text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
                  {signal.number}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {signal.reason}
                </p>
              </article>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            actions={
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/prediction-lab">Open Prediction Lab</Link>
                </Button>
                <Button asChild size="sm" variant="link">
                  <Link href="/methodology#prediction-score">How to read the score</Link>
                </Button>
              </div>
            }
            eyebrow="prediction summary"
            title={predictionSummary.title}
          />
          <div className="mt-5 space-y-3">
            {predictionSummary.candidates.map((candidate) => (
              <div
                className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
                key={candidate.number}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-2xl font-bold tracking-normal text-[var(--color-text-primary)]">
                    {candidate.number}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-brand)]">
                    score {candidate.score}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
                  {candidate.reasons.join(", ")}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-[var(--color-border-soft)] pt-4 text-sm leading-6 text-[var(--color-text-muted)]">
            {predictionSummary.disclaimer}
          </p>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          actions={
            <Button asChild size="sm" variant="outline">
              <Link href="/results">Open Results contract surface</Link>
            </Button>
          }
          eyebrow="read model"
          title="Dashboard read model contract"
          description="These fields define the dashboard shape expected from the service layer so Prisma-backed and computed analytics data can map into one stable API response."
        />
        <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
          <Table>
            <TableHeader className="bg-[var(--color-bg-subtle)]">
              <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  field
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  source
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  purpose
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractRows.map((row) => (
                <TableRow
                  className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                  key={row.field}
                >
                  <TableCell className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                    {row.field}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {row.source}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {row.purpose}
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
