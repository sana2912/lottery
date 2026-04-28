import { AlertTriangle, BookOpen, CalendarDays, FlaskConical, Scale3d } from "lucide-react";
import Link from "next/link";
import { methodologyContent } from "@/frontend/pages/methodology/methodology.content";
import { Badge, Button, Card, SectionHeading } from "@/frontend/primitives";

export function MethodologyPage() {
  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--methodology)]">
            {methodologyContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {methodologyContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {methodologyContent.hero.description}
          </p>
          <div className="mt-5 rounded-none bg-[var(--warning-soft)] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 text-[var(--warning)]" />
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {methodologyContent.hero.warning}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={methodologyContent.pageLinks.eyebrow}
            title={methodologyContent.pageLinks.title}
            description={methodologyContent.pageLinks.description}
          />
          <div className="mt-5 flex flex-col items-start gap-2">
            {methodologyContent.pageLinks.items.map((item) => (
              <Button asChild key={item.href} size="sm" variant="link">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow={methodologyContent.glossary.eyebrow}
          title={methodologyContent.glossary.title}
          description={methodologyContent.glossary.description}
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {methodologyContent.glossary.items.map((item) => (
            <div
              className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
              key={item.term}
            >
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.term}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6" id="prediction-score">
        <SectionHeading
          eyebrow={methodologyContent.predictionScore.eyebrow}
          title={methodologyContent.predictionScore.title}
          description={methodologyContent.predictionScore.description}
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <div className="rounded-none bg-[var(--methodology-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                {methodologyContent.predictionScore.cards.flow.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {methodologyContent.predictionScore.cards.flow.body}
              </p>
            </div>
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                {methodologyContent.predictionScore.cards.example.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {methodologyContent.predictionScore.cards.example.body}
              </p>
            </div>
          </div>
          <div className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-[var(--prediction)]" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {methodologyContent.predictionScore.cards.interpretation.title}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              {methodologyContent.predictionScore.cards.interpretation.body}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6" id="score-breakdown">
        <SectionHeading
          eyebrow={methodologyContent.scoreBreakdown.eyebrow}
          title={methodologyContent.scoreBreakdown.title}
          description={methodologyContent.scoreBreakdown.description}
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
          {methodologyContent.scoreBreakdown.rows.map((row) => (
            <div
              className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
              key={row.id}
            >
              <Badge variant={row.variant}>{row.label}</Badge>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                {row.note}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6" id="backtest-reading">
        <SectionHeading
          eyebrow={methodologyContent.backtestReading.eyebrow}
          title={methodologyContent.backtestReading.title}
          description={methodologyContent.backtestReading.description}
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                {methodologyContent.backtestReading.cards.walkForwardRule.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {methodologyContent.backtestReading.cards.walkForwardRule.body}
              </p>
            </div>
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                {methodologyContent.backtestReading.cards.whatMattersMost.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {methodologyContent.backtestReading.cards.whatMattersMost.body}
              </p>
            </div>
          </div>
          <div className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4">
            <div className="flex items-center gap-2">
              <Scale3d className="size-4 text-[var(--backtest)]" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {methodologyContent.backtestReading.cards.hitRateVersusRank.title}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              {methodologyContent.backtestReading.cards.hitRateVersusRank.body}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6" id="monthly-insights">
        <SectionHeading
          eyebrow={methodologyContent.monthlyInsights.eyebrow}
          title={methodologyContent.monthlyInsights.title}
          description={methodologyContent.monthlyInsights.description}
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                {methodologyContent.monthlyInsights.cards.sampleSizeRule.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {methodologyContent.monthlyInsights.cards.sampleSizeRule.body}
              </p>
            </div>
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                {methodologyContent.monthlyInsights.cards.scopeRule.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {methodologyContent.monthlyInsights.cards.scopeRule.body}
              </p>
            </div>
          </div>
          <div className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-[var(--primary)]" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {methodologyContent.monthlyInsights.cards.recommendedUse.title}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              {methodologyContent.monthlyInsights.cards.recommendedUse.body}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6" id="limitations">
        <SectionHeading
          eyebrow={methodologyContent.limitations.eyebrow}
          title={methodologyContent.limitations.title}
          description={methodologyContent.limitations.description}
        />
        <div className="mt-5 space-y-3">
          {methodologyContent.limitations.items.map((item) => (
            <div className="rounded-none bg-[var(--warning-soft)] p-4" key={item}>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Button asChild variant="link">
            <Link href={methodologyContent.limitations.linkHref}>
              <BookOpen />
              {methodologyContent.limitations.linkLabel}
            </Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
