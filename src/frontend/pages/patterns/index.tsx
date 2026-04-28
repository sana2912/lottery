import { Heatmap } from "@/frontend/chart-primitives";
import { EmptyState, MetricCard } from "@/frontend/components";
import { getAnalyticsModel } from "@/frontend/pages/analytics/analytics.data";
import { patternsContent } from "@/frontend/pages/patterns/patterns.content";
import {
  getFlaggedNumbers,
  toPatternHeatmapCells
} from "@/frontend/pages/patterns/patterns.mappers";
import { Badge, Card, SectionHeading } from "@/frontend/primitives";

export async function PatternsPage() {
  const analytics = await getAnalyticsModel();
  const patternCells = toPatternHeatmapCells(analytics);
  const flaggedNumbers = getFlaggedNumbers(analytics);

  return (
    <main className="space-y-6">
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
            eyebrow={patternsContent.sample.eyebrow}
            title={patternsContent.sample.title}
          />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint={patternsContent.metrics.patterns.hint}
              label={patternsContent.metrics.patterns.label}
              value={String(analytics.patternSummaries.length)}
            />
            <MetricCard
              hint={patternsContent.metrics.flaggedNumbers.hint}
              label={patternsContent.metrics.flaggedNumbers.label}
              value={String(flaggedNumbers.length)}
            />
          </div>
        </Card>
      </section>

      {analytics.patternSummaries.length === 0 ? (
        <EmptyState
          description={patternsContent.emptyState.description}
          title={patternsContent.emptyState.title}
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Heatmap cells={patternCells} columns={4} title={patternsContent.charts.heatmapTitle} />

        <Card className="p-6">
          <SectionHeading
            eyebrow={patternsContent.sections.patternSummaries.eyebrow}
            title={patternsContent.sections.patternSummaries.title}
          />
          <div className="mt-5 space-y-4">
            {analytics.patternSummaries.map((summary) => (
              <article
                className="border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
                key={summary.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold tracking-normal text-[var(--color-text-primary)]">
                      {summary.label}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {summary.insight}
                    </p>
                  </div>
                  <Badge variant="brand">{summary.frequencyPercent}%</Badge>
                </div>
                <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                  {summary.hitCount} {patternsContent.sections.patternSummaries.hitsLabel}{" "}
                  {summary.sampleSize}{" "}
                  {patternsContent.sections.patternSummaries.trackedGroupsLabel}
                </p>
              </article>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow={patternsContent.sections.flaggedNumbers.eyebrow}
          title={patternsContent.sections.flaggedNumbers.title}
        />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {flaggedNumbers.map((stat) => (
            <article
              className="border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
              key={`${stat.prizeType}-${stat.number}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
                    {stat.number}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{stat.prizeType}</p>
                </div>
                <Badge variant={stat.trendScore >= 70 ? "success" : "muted"}>
                  {stat.trendScore}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {stat.patternFlags.map((flag) => (
                  <Badge key={`${stat.number}-${flag}`} variant="brand">
                    {flag}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Card>
    </main>
  );
}
