import Link from "next/link";
import { Heatmap, TimeSeriesChart } from "@/frontend/chart-primitives";
import { EmptyState, FilterToolbar, MetricCard } from "@/frontend/components";
import { analyticsContent } from "@/frontend/pages/analytics/analytics.content";
import {
  type AnalyticsPageData,
  getAnalyticsPageData
} from "@/frontend/pages/analytics/analytics.data";
import {
  getTopDigits,
  getTopNumbers,
  toDigitHeatmapCells,
  toNumberFrequencyPoints
} from "@/frontend/pages/analytics/analytics.mappers";
import {
  buildAnalyticsHref,
  parseAnalyticsSearchParams
} from "@/frontend/pages/analytics/analytics.query";
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

export async function AnalyticsPage({
  pageData,
  searchParams
}: Readonly<{
  pageData?: AnalyticsPageData;
  searchParams?: Record<string, string | string[] | undefined>;
}>) {
  const query = parseAnalyticsSearchParams(searchParams);
  const { model: analytics, state } = pageData ?? (await getAnalyticsPageData(query));
  const topDigits = getTopDigits(analytics);
  const topNumbers = getTopNumbers(analytics);

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
            {analyticsContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {analyticsContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {analyticsContent.hero.description}
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={analyticsContent.sample.eyebrow}
            title={analyticsContent.sample.title}
          />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint={analyticsContent.metrics.draws.hint}
              label={analyticsContent.metrics.draws.label}
              value={String(analytics.summary.drawCount)}
            />
            <MetricCard
              hint={analyticsContent.metrics.source.hint}
              label={analyticsContent.metrics.source.label}
              value={analytics.source}
            />
          </div>
        </Card>
      </section>

      <FilterToolbar
        filters={
          <div className="flex flex-wrap gap-3">
            <MetricCard
              label={analyticsContent.metrics.digitGroups}
              value={String(analytics.digitStats.length)}
            />
            <MetricCard
              label={analyticsContent.metrics.numberGroups}
              value={String(analytics.numberStats.length)}
            />
            <MetricCard
              label={analyticsContent.metrics.patterns}
              value={String(analytics.patternSummaries.length)}
            />
            <MetricCard
              label={analyticsContent.metrics.generated}
              value={new Date(analytics.generatedAt).toLocaleDateString("th-TH")}
            />
            {[30, 60, 120].map((windowSize) => (
              <Button
                asChild
                className="rounded-none px-3 py-2 text-xs"
                key={windowSize}
                variant="outline"
              >
                <Link href={buildAnalyticsHref(query, { page: 1, windowSize })}>
                  Window {windowSize}
                </Link>
              </Button>
            ))}
            {[
              { numberLength: 2 as const, prizeType: "TWO_DIGIT" as const },
              { numberLength: 3 as const, prizeType: "THREE_DIGIT" as const },
              { numberLength: 6 as const, prizeType: "FIRST" as const }
            ].map((filter) => (
              <Button
                asChild
                className="rounded-none px-3 py-2 text-xs"
                key={filter.prizeType}
                variant="ghost"
              >
                <Link
                  href={buildAnalyticsHref(query, {
                    numberLength: filter.numberLength,
                    page: 1,
                    prizeType: filter.prizeType
                  })}
                >
                  {filter.prizeType}
                </Link>
              </Button>
            ))}
          </div>
        }
        summary={analyticsContent.filterSummary}
      />

      {state === "error" ? (
        <EmptyState
          description={analyticsContent.errorState.description}
          title={analyticsContent.errorState.title}
        />
      ) : null}

      {state === "empty" ? (
        <EmptyState
          description={analyticsContent.emptyState.description}
          title={analyticsContent.emptyState.title}
        />
      ) : null}

      {state === "ready" ? (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <TimeSeriesChart
              points={toNumberFrequencyPoints(analytics)}
              title={analyticsContent.charts.numberFrequencyTitle}
            />
            <Heatmap
              cells={toDigitHeatmapCells(analytics)}
              title={analyticsContent.charts.digitHeatmapTitle}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Card className="p-6">
              <SectionHeading
                eyebrow={analyticsContent.sections.numberStats.eyebrow}
                title={analyticsContent.sections.numberStats.title}
              />
              <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
                <Table>
                  <TableHeader className="bg-[var(--color-bg-subtle)]">
                    <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                      <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {analyticsContent.sections.numberStats.tableHeaders.number}
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {analyticsContent.sections.numberStats.tableHeaders.frequency}
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {analyticsContent.sections.numberStats.tableHeaders.missing}
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {analyticsContent.sections.numberStats.tableHeaders.pattern}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topNumbers.map((stat) => (
                      <TableRow
                        className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                        key={`${stat.prizeType}-${stat.number}`}
                      >
                        <TableCell className="px-4 py-3 font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                          {stat.number}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {stat.frequencyPercent}%
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {stat.missingDrawCount}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {stat.patternFlags.map((flag) => (
                              <Badge key={`${stat.number}-${flag}`} variant="brand">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="p-6">
              <SectionHeading
                eyebrow={analyticsContent.sections.digitStats.eyebrow}
                title={analyticsContent.sections.digitStats.title}
              />
              <div className="mt-5 space-y-3">
                {topDigits.map((stat) => (
                  <div
                    className="flex items-center justify-between border-b border-[var(--color-border-soft)] pb-3"
                    key={`${stat.prizeType}-${stat.position}-${stat.digit}`}
                  >
                    <div>
                      <p className="font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                        {stat.digit}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {stat.prizeType} {analyticsContent.shared.positionLabel} {stat.position}
                      </p>
                    </div>
                    <Badge variant={stat.trendDirection === "up" ? "success" : "muted"}>
                      {stat.frequencyPercent}%
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </>
      ) : null}
    </main>
  );
}
