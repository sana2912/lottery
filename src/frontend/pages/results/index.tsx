import Link from "next/link";
import { EmptyState } from "@/frontend/components";
import { SlidingNumber } from "@/frontend/components/animate-ui/primitives/texts/sliding-number";
import { resultsContent } from "@/frontend/pages/results/results.content";
import { getResultsPageData } from "@/frontend/pages/results/results.data";
import {
  buildResultsHref,
  getResultsFilterPills,
  parseResultsSearchParams
} from "@/frontend/pages/results/results.query";
import {
  Badge,
  Button,
  Card,
  Input,
  SectionHeading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea
} from "@/frontend/primitives";
import type { SearchQuery } from "@/schema/app/query.schema";
import type { ResultsReadModel } from "@/schema/app/results.schema";

function StatCard({ stat }: Readonly<{ stat: ResultsReadModel["stats"][number] }>) {
  const isNumericValue = /^\d+$/.test(stat.value);

  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">{stat.label}</p>
      <p className="mt-3 text-2xl font-bold tracking-normal text-[var(--color-text-primary)]">
        {isNumericValue ? (
          <SlidingNumber
            className="inline-flex"
            fromNumber={0}
            inView
            initiallyStable={false}
            number={Number(stat.value)}
          />
        ) : (
          stat.value
        )}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{stat.hint}</p>
    </Card>
  );
}

export async function ResultsPage({
  searchParams
}: Readonly<{
  searchParams?: Record<string, string | string[] | undefined>;
}>) {
  const query = parseResultsSearchParams(searchParams);
  const { model: resultsModel, state } = await getResultsPageData(query);
  const filterPills = getResultsFilterPills(query);

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden bg-[image:var(--color-bg-hero-accent),var(--color-bg-hero)] p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
            {resultsModel.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)] md:text-5xl">
            {resultsModel.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {resultsModel.hero.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-none bg-[var(--color-brand)] px-4 py-[13px] text-[var(--primary-foreground)] hover:bg-[var(--color-brand-strong)]">
              {resultsContent.heroActions.latestLabel}
            </Button>
            <Button
              className="rounded-none border-[var(--color-brand-outline)] bg-[var(--color-bg-canvas)] px-4 py-[13px] text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
              variant="outline"
            >
              {resultsContent.heroActions.contractLabel}
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between bg-[var(--color-bg-dark)] p-6 text-[var(--color-text-inverse)]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-text-inverse-soft)]">
              {resultsModel.hero.coverageLabel}
            </p>
            <p className="mt-4 text-3xl font-bold tracking-normal">
              {resultsModel.hero.coverageValue}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {resultsModel.highlights.map((highlight) => (
              <div
                className="rounded-none border border-[var(--color-border-inverse-soft)] bg-[var(--color-bg-dark-soft)] p-4"
                key={highlight.title}
              >
                <p className="font-semibold">{highlight.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-inverse-soft)]">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {resultsModel.stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <Card className="p-6">
          <SectionHeading
            actions={
              <form action="/results" className="flex w-full max-w-sm gap-2">
                <Input
                  className="h-11 rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]"
                  defaultValue={query.q ?? ""}
                  name="q"
                  placeholder={resultsContent.filters.searchPlaceholder}
                />
                {query.prizeType ? (
                  <input name="prizeType" type="hidden" value={query.prizeType} />
                ) : null}
                <Button className="rounded-none px-4 py-[13px]" type="submit">
                  Apply
                </Button>
              </form>
            }
            className="border-b border-[var(--color-border-soft)] pb-5"
            eyebrow={resultsContent.filters.sectionEyebrow}
            title={resultsContent.filters.sectionTitle}
          />

          <div className="mt-5 flex flex-wrap gap-2">
            {filterPills.map((pill) => (
              <Badge key={pill} variant="brand">
                {pill}
              </Badge>
            ))}
            {filterPills.length > 0 ? (
              <Button asChild className="rounded-none px-3 py-2 text-xs" variant="outline">
                <Link href="/results">Reset filters</Link>
              </Button>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {resultsModel.filters.lotteryTypes.map((type) => (
              <Button
                asChild
                className="rounded-none bg-[var(--color-bg-brand-soft)] px-3 py-2 text-xs text-[var(--color-brand)] hover:bg-[var(--color-bg-brand-soft-strong)]"
                key={type}
                variant="ghost"
              >
                <Link
                  href={buildResultsHref(query, {
                    lotteryType: type as SearchQuery["lotteryType"],
                    page: 1
                  })}
                >
                  {type}
                </Link>
              </Button>
            ))}

            {resultsModel.filters.prizeTypes.map((type) => (
              <Button
                asChild
                className="rounded-none border-[var(--color-brand-outline)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
                key={type}
                variant="outline"
              >
                <Link
                  href={buildResultsHref(query, {
                    page: 1,
                    prizeType:
                      query.prizeType === type ? undefined : (type as SearchQuery["prizeType"])
                  })}
                >
                  {type}
                </Link>
              </Button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {state === "error" ? (
              <EmptyState
                description={resultsContent.errorState.description}
                title={resultsContent.errorState.title}
              />
            ) : null}

            {state === "empty" ? (
              <EmptyState
                description={resultsContent.emptyState.description}
                title={resultsContent.emptyState.title}
              />
            ) : null}

            {state === "ready"
              ? resultsModel.draws.map((draw) => (
                  <article
                    className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5"
                    key={draw.id}
                  >
                    <div className="flex flex-col gap-3 border-b border-[var(--color-border-soft)] pb-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-brand-outline)]">
                          {draw.drawDate}
                        </p>
                        <h3 className="mt-1 text-xl font-bold tracking-normal text-[var(--color-text-primary)]">
                          Draw {draw.drawNo}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant={draw.status === "complete" ? "success" : "warning"}>
                          {draw.statusLabel}
                        </Badge>
                        <Badge variant="neutral">{draw.coverage}</Badge>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/results/${draw.id}`}>
                            {resultsContent.filters.detailLabel}
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {draw.prizes.map((prize) => (
                        <div
                          className="rounded-none bg-[var(--color-bg-canvas)] px-4 py-3"
                          key={`${draw.id}-${prize.label}`}
                        >
                          <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                            {prize.label}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                            {prize.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              : null}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={resultsContent.sidebar.whyEyebrow}
            title={resultsContent.sidebar.title}
          />
          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--color-text-secondary)]">
            {resultsContent.sidebar.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-6 rounded-none bg-[var(--color-bg-panel-brand)] p-4">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
              {resultsContent.sidebar.contractEyebrow}
            </p>
            <div className="mt-3 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
              <Table>
                <TableHeader className="bg-[var(--color-bg-subtle)]">
                  <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      {resultsContent.contractTableHeaders.field}
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      {resultsContent.contractTableHeaders.source}
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      {resultsContent.contractTableHeaders.purpose}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultsModel.contractRows.map((row) => (
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
          </div>

          <div className="mt-6">
            <SectionHeading
              eyebrow={resultsContent.sidebar.noteEyebrow}
              title={resultsContent.sidebar.noteTitle}
            />
            <div className="mt-3">
              <Textarea
                className="min-h-32 rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]"
                readOnly
                value={resultsModel.mockNote}
              />
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
