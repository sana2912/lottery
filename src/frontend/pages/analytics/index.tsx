import Link from "next/link";
import { EmptyState, FilterToolbar, MetricCard } from "@/frontend/components";
import { analyticsContent } from "@/frontend/pages/analytics/analytics.content";
import {
  type AnalyticsPageData,
  getAnalyticsPageData
} from "@/frontend/pages/analytics/analytics.data";
import {
  analyticsPrizeOptions,
  analyticsWindowOptions,
  buildAnalyticsHrefQuery,
  buildAnalyticsViewModel
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
import type { NumberStat } from "@/schema/app/analytics.schema";

export async function AnalyticsPage({
  pageData,
  searchParams
}: Readonly<{
  pageData?: AnalyticsPageData;
  searchParams?: Record<string, string | string[] | undefined>;
}>) {
  const query = parseAnalyticsSearchParams(searchParams);
  const { model: analytics, state } = pageData ?? (await getAnalyticsPageData(query));
  const view = buildAnalyticsViewModel(analytics, query);

  return (
    <main className="space-y-6">
      <FilterToolbar
        filters={
          <>
            <div className="sm:col-span-2 xl:col-span-2">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
                {analyticsContent.filters.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {analyticsContent.filters.prizeSummary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {analyticsPrizeOptions.map((option) => (
                  <Button
                    asChild
                    className="rounded-none"
                    key={option.value}
                    size="sm"
                    variant={query.prizeType === option.value ? "secondary" : "outline"}
                  >
                    <Link
                      href={buildAnalyticsHref(
                        query,
                        buildAnalyticsHrefQuery(option.value, option.numberLength)
                      )}
                    >
                      {option.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 xl:col-span-2">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                {analyticsContent.filters.windowLabel}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {analyticsWindowOptions.map((windowSize) => (
                  <Button
                    asChild
                    className="rounded-none"
                    key={windowSize}
                    size="sm"
                    variant={query.windowSize === windowSize ? "secondary" : "outline"}
                  >
                    <Link href={buildAnalyticsHref(query, { page: 1, windowSize })}>
                      {windowSize} draws
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
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
          <SectionHeading eyebrow="Context" title="Selected analysis" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricCard
              label={analyticsContent.metrics.prizeType}
              value={view.context.prizeLabel}
            />
            <MetricCard
              label={analyticsContent.metrics.windowSize}
              value={`${view.context.windowSize} draws`}
            />
            <MetricCard
              label={analyticsContent.metrics.sampleSize}
              value={`${view.context.sampleSize} draws`}
            />
            <MetricCard
              label={analyticsContent.metrics.numberLength}
              value={view.context.numberLengthLabel}
            />
          </div>
        </Card>
      </section>

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

      {state === "ready" && view.context.numberLength === 2 ? (
        <TwoDigitAnalytics view={view} />
      ) : null}

      {state === "ready" && view.context.numberLength === 3 ? (
        <ThreeDigitAnalytics view={view} />
      ) : null}

      {state === "ready" && view.context.numberLength === 6 ? (
        <SixDigitAnalytics query={query} view={view} />
      ) : null}
    </main>
  );
}

function TwoDigitAnalytics({ view }: { view: ReturnType<typeof buildAnalyticsViewModel> }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        {view.signalCards.map((card) => (
          <MetricCard
            hint={card.hint}
            key={card.label}
            label={card.label}
            tone={card.tone}
            value={card.value}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <NumberStatsTable
          numbers={view.exactNumbers}
          title={analyticsContent.sections.numberStats.title}
        />
        <PositionStatsCard items={view.digitPositions} />
      </section>
    </>
  );
}

function ThreeDigitAnalytics({ view }: { view: ReturnType<typeof buildAnalyticsViewModel> }) {
  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <NumberStatsTable
          emptyCopy="ยังไม่มีเลข 3 หลักที่ซ้ำอย่างมีนัยในช่วงนี้"
          numbers={view.topRepeatedNumbers}
          title={analyticsContent.sections.repeatedThreeDigit.title}
        />
        <ShapeSummaryCard shapes={view.shapeSummary} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <PositionStatsCard items={view.digitPositions} />
        <RecentExamplesCard examples={view.recentExamples} />
      </section>
    </>
  );
}

function SixDigitAnalytics({
  query,
  view
}: {
  query: ReturnType<typeof parseAnalyticsSearchParams>;
  view: ReturnType<typeof buildAnalyticsViewModel>;
}) {
  return (
    <>
      <Card className="border-[var(--color-border-default)] bg-[var(--color-bg-brand-soft)] p-5">
        <p className="text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">
          {analyticsContent.notes.sixDigit}
        </p>
        <Button asChild className="mt-4 rounded-none" size="sm" variant="outline">
          <Link
            href={`/patterns?prizeType=${view.context.prizeType}&windowSize=${query.windowSize}`}
          >
            Explore deeper shape patterns
          </Link>
        </Button>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <PositionStatsCard items={view.digitPositions} />
        <OverallDigitDistributionCard items={view.overallDigits} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <ShapeSummaryCard shapes={view.shapeSummary} />
        <RecentExamplesCard examples={view.recentExamples} />
      </section>
    </>
  );
}

function NumberStatsTable({
  emptyCopy,
  numbers,
  title
}: {
  emptyCopy?: string;
  numbers: readonly NumberStat[];
  title: string;
}) {
  return (
    <Card className="p-6">
      <SectionHeading eyebrow={analyticsContent.sections.numberStats.eyebrow} title={title} />
      {numbers.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-[var(--color-text-muted)]">{emptyCopy ?? "-"}</p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
          <Table>
            <TableHeader className="bg-[var(--color-bg-subtle)]">
              <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {analyticsContent.tableHeaders.number}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {analyticsContent.tableHeaders.frequency}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {analyticsContent.tableHeaders.missing}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {analyticsContent.tableHeaders.pattern}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.map((stat) => (
                <TableRow
                  className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                  key={`${stat.prizeType}-${stat.number}`}
                >
                  <TableCell className="px-4 py-3 font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                    {stat.number}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {formatPercent(stat.frequencyPercent)}
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
      )}
    </Card>
  );
}

function PositionStatsCard({
  items
}: {
  items: ReturnType<typeof buildAnalyticsViewModel>["digitPositions"];
}) {
  return (
    <Card className="p-6">
      <SectionHeading
        eyebrow={analyticsContent.sections.digitStats.eyebrow}
        title={analyticsContent.sections.digitStats.title}
      />
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--color-border-soft)] pb-3"
            key={item.id}
          >
            <div>
              <p className="font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                {item.label}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{item.positionLabel}</p>
            </div>
            <Badge variant={item.trendDirection === "up" ? "success" : "muted"}>
              {item.trendDirection}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OverallDigitDistributionCard({
  items
}: {
  items: ReturnType<typeof buildAnalyticsViewModel>["overallDigits"];
}) {
  return (
    <Card className="p-6">
      <SectionHeading
        eyebrow={analyticsContent.sections.digitDistribution.eyebrow}
        title={analyticsContent.sections.digitDistribution.title}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            className="border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-4"
            key={item.digit}
          >
            <p className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
              {item.digit}
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {item.hitCount} hits · {item.sharePercent}% share
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ShapeSummaryCard({
  shapes
}: {
  shapes: ReturnType<typeof buildAnalyticsViewModel>["shapeSummary"];
}) {
  return (
    <Card className="p-6">
      <SectionHeading
        eyebrow={analyticsContent.sections.shapeSummary.eyebrow}
        title={analyticsContent.sections.shapeSummary.title}
      />
      <div className="mt-5 flex flex-wrap gap-2">
        {shapes.map((shape) => (
          <Badge key={shape.id} variant="brand">
            {shape.label}: {shape.count}/{shape.sampleSize}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

function RecentExamplesCard({
  examples
}: {
  examples: ReturnType<typeof buildAnalyticsViewModel>["recentExamples"];
}) {
  return (
    <Card className="p-6">
      <SectionHeading
        eyebrow={analyticsContent.sections.exactExamples.eyebrow}
        title={analyticsContent.sections.exactExamples.title}
      />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {examples.map((example) => (
          <article
            className="border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-4"
            key={`${example.prizeType}-${example.number}`}
          >
            <p className="font-mono text-2xl font-bold tracking-normal text-[var(--color-text-primary)]">
              {example.number}
            </p>
            <p className="mt-2 font-mono text-xs text-[var(--color-text-secondary)]">
              {example.dna}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {example.flags.map((flag) => (
                <Badge key={`${example.number}-${flag}`} variant="neutral">
                  {flag}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

function formatPercent(value: number) {
  return `${Math.min(value, 100)}%`;
}
