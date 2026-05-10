import Link from "next/link";
import { EmptyState, MetricCard } from "@/frontend/components";
import { getAnalyticsPageData } from "@/frontend/pages/analytics/analytics.data";
import { PatternsFilterPanel } from "@/frontend/pages/patterns/patterns.components";
import { patternsContent } from "@/frontend/pages/patterns/patterns.content";
import {
  buildPatternReadModel,
  buildPatternsHref,
  parsePatternSearchParams,
  toPatternsAnalyticsQuery
} from "@/frontend/pages/patterns/patterns.mappers";
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

type PatternsPageProps = Readonly<{
  searchParams?: Record<string, string | string[] | undefined>;
}>;

export async function PatternsPage({ searchParams }: PatternsPageProps = {}) {
  const query = parsePatternSearchParams(searchParams);
  const { model: analytics, state } = await getAnalyticsPageData(toPatternsAnalyticsQuery(query));
  const patterns = buildPatternReadModel(analytics, query);

  return (
    <main className="space-y-6">
      <PatternsFilterPanel query={query} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
            {patternsContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {patternsContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {patternsContent.hero.description}
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={patternsContent.sections.context.eyebrow}
            title={patternsContent.sections.context.title}
          />
          <div className="mt-5 grid gap-3">
            <MetricCard label="Prize type" value={patterns.prizeLabel} />
            <MetricCard label="Sample size" value={String(patterns.sampleSize)} />
            <MetricCard label="Number length" value={patterns.numberLengthLabel} />
            <MetricCard label="Draw count" value={String(analytics.summary.drawCount)} />
          </div>
        </Card>
      </section>

      {state === "error" || patterns.overviewCards.length === 0 ? (
        <EmptyState
          description={patternsContent.emptyState.description}
          title={patternsContent.emptyState.title}
        />
      ) : null}

      <section className="space-y-4">
        <SectionHeading
          eyebrow={patternsContent.sections.overview.eyebrow}
          title={patternsContent.sections.overview.title}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {patterns.overviewCards.map((card) => (
            <article
              className="border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-5 shadow-[var(--shadow-card)]"
              key={card.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{card.label}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {card.value} / {card.total}
                  </p>
                </div>
                <Badge variant={getBadgeVariant(card.tone)}>{card.percent}%</Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                {card.summary}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <Card className="p-6">
          <SectionHeading
            eyebrow={patternsContent.sections.playground.eyebrow}
            title={patternsContent.sections.playground.title}
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              asChild
              className="rounded-none"
              size="sm"
              variant={!patterns.activePattern ? "secondary" : "outline"}
            >
              <Link href={buildPatternsHref(query, { pattern: undefined })}>All patterns</Link>
            </Button>
            {patterns.playground.map((pattern) => (
              <Button
                asChild
                className="rounded-none"
                key={pattern.id}
                size="sm"
                variant={patterns.activePattern === pattern.id ? "secondary" : "ghost"}
              >
                <Link href={buildPatternsHref(query, { pattern: pattern.id })}>
                  {pattern.label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            <MetricCard label="Active view" value={patterns.activePattern ?? "All patterns"} />
            <MetricCard label="Window" value={patterns.windowLabel} />
            <MetricCard label="Shape records" value={String(patterns.totalHits)} />
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={patternsContent.sections.examples.eyebrow}
            title={patternsContent.sections.examples.title}
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {patterns.examples.map((example) => (
              <article
                className="border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-4"
                key={`${example.prizeType}-${example.number}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-2xl font-bold tracking-normal text-[var(--color-text-primary)]">
                      {example.number}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                      {example.prizeType}
                    </p>
                  </div>
                  <Badge variant="neutral">mini DNA</Badge>
                </div>
                <p className="mt-3 font-mono text-xs text-[var(--color-text-secondary)]">
                  {example.dna}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {example.flags.map((flag) => (
                    <Badge key={`${example.number}-${flag}`} variant="brand">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow={patternsContent.sections.distribution.eyebrow}
          title={patternsContent.sections.distribution.title}
        />
        <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
          <Table>
            <TableHeader className="bg-[var(--color-bg-subtle)]">
              <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Signal
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Reading
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns.distribution.map((item) => (
                <TableRow
                  className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                  key={item.id}
                >
                  <TableCell className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                    {item.label}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {item.value}
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

function getBadgeVariant(tone: string): React.ComponentProps<typeof Badge>["variant"] {
  switch (tone) {
    case "cold":
      return "cold";
    case "hot":
      return "hot";
    case "overdue":
      return "overdue";
    case "success":
      return "success";
    case "warning":
      return "warning";
    default:
      return "neutral";
  }
}
