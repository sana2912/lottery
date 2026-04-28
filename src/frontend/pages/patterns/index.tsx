import { Heatmap } from "@/frontend/chart-primitives";
import { EmptyState, MetricCard } from "@/frontend/components";
import { Badge, Card, SectionHeading } from "@/frontend/primitives";
import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type AnalyticsReadModel, analyticsReadModelSchema } from "@/schema/app/analytics.schema";

const analyticsFallback = analyticsReadModelSchema.parse({
  digitStats: [],
  generatedAt: "2026-04-28T00:00:00.000Z",
  numberStats: [],
  patternSummaries: [],
  source: "mock",
  summary: {
    drawCount: 0,
    generatedAt: "2026-04-28T00:00:00.000Z"
  }
});

export async function PatternsPage() {
  const analytics = await getAnalyticsModel();
  const patternCells = analytics.patternSummaries.map((summary) => ({
    id: summary.id,
    label: summary.pattern,
    value: summary.hitCount
  }));
  const flaggedNumbers = analytics.numberStats
    .filter((stat) => stat.patternFlags.length > 0)
    .slice(0, 12);

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
            Patterns
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            Repeating shapes in historical numbers
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            Odd/even, high/low, doubles, mirrors, and sequences are summarized as descriptive
            patterns from past draw records.
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Sample" title="Pattern coverage" />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint="Pattern groups with at least one matching number."
              label="Patterns"
              value={String(analytics.patternSummaries.length)}
            />
            <MetricCard
              hint="Number groups carrying one or more pattern flags."
              label="Flagged numbers"
              value={String(flaggedNumbers.length)}
            />
          </div>
        </Card>
      </section>

      {analytics.patternSummaries.length === 0 ? (
        <EmptyState
          description="Pattern summaries will appear after number stats are available."
          title="No pattern records"
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Heatmap cells={patternCells} columns={4} title="Pattern heatmap" />

        <Card className="p-6">
          <SectionHeading eyebrow="Pattern summaries" title="Historical shape notes" />
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
                  {summary.hitCount} hits from {summary.sampleSize} tracked number groups
                </p>
              </article>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading eyebrow="Flagged numbers" title="Numbers grouped by pattern flags" />
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

async function getAnalyticsModel(): Promise<AnalyticsReadModel> {
  try {
    return await apiGet<AnalyticsReadModel>(apiRoutes.analytics, {
      cache: "no-store",
      schema: analyticsReadModelSchema
    });
  } catch {
    return analyticsFallback;
  }
}
