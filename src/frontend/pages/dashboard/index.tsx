import Link from "next/link";
import { EmptyState } from "@/frontend/components";
import { MetricCard } from "@/frontend/components/cards/MetricCard";
import { dashboardContent } from "@/frontend/pages/dashboard/dashboard.content";
import {
  type DashboardPageData,
  getDashboardPageData
} from "@/frontend/pages/dashboard/dashboard.data";
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

export async function DashboardPage({ pageData }: Readonly<{ pageData?: DashboardPageData }> = {}) {
  const { model, state } = pageData ?? (await getDashboardPageData());
  const { contractRows, hero, latestDraw, metrics, predictionSummary, signals } = model;

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

        <Card className="border-[color:rgba(249,115,22,0.18)] bg-[linear-gradient(180deg,rgba(255,247,237,0.9),rgba(255,255,255,0.72))] p-6 text-[var(--color-text-primary)] shadow-[var(--shadow-glass-strong)]">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
            {dashboardContent.latestDraw.eyebrow}
          </p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-normal">{latestDraw.drawDate}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {dashboardContent.latestDraw.drawLabel} {latestDraw.drawNo}
              </p>
            </div>
            <Badge variant={state === "ready" ? "success" : "warning"}>
              {latestDraw.statusLabel}
            </Badge>
          </div>
          <div className="mt-6 rounded-none border border-[var(--color-border-glass)] bg-[var(--color-bg-glass-strong)] p-4 backdrop-blur-lg">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
              {latestDraw.primaryPrize.label}
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-normal text-[var(--color-text-primary)]">
              {latestDraw.primaryPrize.value}
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {latestDraw.secondaryPrizes.map((prize) => (
              <div
                className="flex items-center justify-between gap-4 border-b border-[var(--color-border-soft)] pb-3 last:border-b-0 last:pb-0"
                key={prize.label}
              >
                <span className="text-sm text-[var(--color-text-secondary)]">{prize.label}</span>
                <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
                  {prize.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--color-border-soft)] pt-4">
            {state === "ready" ? (
              <>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/results/${latestDraw.id}`}>
                    {dashboardContent.latestDraw.detailActionLabel}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="border-[var(--color-border-glass)] bg-[var(--color-bg-glass)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-glass-strong)]"
                  size="sm"
                  variant="outline"
                >
                  <Link href="/calendar">{dashboardContent.latestDraw.calendarActionLabel}</Link>
                </Button>
              </>
            ) : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            aria-label={`${dashboardContent.metricLinks[metric.label as keyof typeof dashboardContent.metricLinks]?.label ?? dashboardContent.shared.defaultActionLabel} for ${metric.label}`}
            className="block"
            href={
              dashboardContent.metricLinks[
                metric.label as keyof typeof dashboardContent.metricLinks
              ]?.href ?? "/dashboard"
            }
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
                  <Link href={dashboardContent.signals.actions.detailHref}>
                    {dashboardContent.signals.actions.detailLabel}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="link">
                  <Link href={dashboardContent.signals.actions.methodologyHref}>
                    {dashboardContent.signals.actions.methodologyLabel}
                  </Link>
                </Button>
              </div>
            }
            eyebrow={dashboardContent.signals.eyebrow}
            title={dashboardContent.signals.title}
          />
          {state === "error" ? (
            <div className="mt-5">
              <EmptyState
                description={dashboardContent.errorState.description}
                title={dashboardContent.errorState.title}
              />
            </div>
          ) : null}
          {state === "empty" ? (
            <div className="mt-5">
              <EmptyState
                description={dashboardContent.emptyState.description}
                title={dashboardContent.emptyState.title}
              />
            </div>
          ) : null}
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {state === "ready"
              ? signals.map((signal) => {
                  let badgeVariant: React.ComponentProps<typeof Badge>["variant"] = "overdue";

                  if (signal.tone === "hot") {
                    badgeVariant = "hot";
                  } else if (signal.tone === "cold") {
                    badgeVariant = "cold";
                  }

                  return (
                    <article
                      className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5"
                      key={signal.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Badge variant={badgeVariant}>{signal.label}</Badge>
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
                  );
                })
              : null}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            actions={
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={dashboardContent.predictionSummary.actions.detailHref}>
                    {dashboardContent.predictionSummary.actions.detailLabel}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="link">
                  <Link href={dashboardContent.predictionSummary.actions.methodologyHref}>
                    {dashboardContent.predictionSummary.actions.methodologyLabel}
                  </Link>
                </Button>
              </div>
            }
            eyebrow={dashboardContent.predictionSummary.eyebrow}
            title={predictionSummary.title}
          />
          <div className="mt-5 space-y-3">
            {predictionSummary.candidates.length > 0 ? (
              predictionSummary.candidates.map((candidate) => (
                <div
                  className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
                  key={candidate.number}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-2xl font-bold tracking-normal text-[var(--color-text-primary)]">
                      {candidate.number}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-brand)]">
                      {dashboardContent.predictionSummary.scoreLabel} {candidate.score}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
                    {candidate.reasons.join(", ")}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                description={dashboardContent.predictionSummary.emptyDescription}
                title={predictionSummary.title}
              />
            )}
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
              <Link href={dashboardContent.readModel.actionHref}>
                {dashboardContent.readModel.actionLabel}
              </Link>
            </Button>
          }
          eyebrow={dashboardContent.readModel.eyebrow}
          title={dashboardContent.readModel.title}
          description={dashboardContent.readModel.description}
        />
        <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
          <Table>
            <TableHeader className="bg-[var(--color-bg-subtle)]">
              <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {dashboardContent.contractTableHeaders.field}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {dashboardContent.contractTableHeaders.source}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {dashboardContent.contractTableHeaders.purpose}
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
