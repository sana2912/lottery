import { CalendarDays, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";
import { EmptyState, MetricCard } from "@/frontend/components";
import { calendarContent } from "@/frontend/pages/calendar/calendar.content";
import { getCalendarPageData } from "@/frontend/pages/calendar/calendar.data";
import { getDaysUntilNextDraw } from "@/frontend/pages/calendar/calendar.mappers";
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

export async function CalendarPage() {
  const { model: calendar, state } = await getCalendarPageData();
  const daysUntilNextDraw = getDaysUntilNextDraw(calendar);

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--calendar)]">
            {calendarContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {calendarContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {calendarContent.hero.description}
          </p>
          <div className="mt-4">
            <Button asChild className="px-0" variant="link">
              <Link href={calendarContent.actions.methodologyHref}>
                {calendarContent.actions.methodologyLabel}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={calendarContent.nextDraw.eyebrow}
            title={calendar.nextDraw.drawDate}
          />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint={calendarContent.metrics.countdown.hint}
              label={calendarContent.metrics.countdown.label}
              tone="default"
              value={`${daysUntilNextDraw} ${calendarContent.metrics.countdown.suffix}`}
            />
            <MetricCard
              hint={calendarContent.metrics.drawNumber.hint}
              label={calendarContent.metrics.drawNumber.label}
              value={calendar.nextDraw.drawNo ?? "-"}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="brand">{calendar.nextDraw.status}</Badge>
            <Badge variant={calendar.source === "api" ? "success" : "warning"}>
              {calendar.source === "api"
                ? calendarContent.badges.liveApi
                : calendarContent.badges.unavailable}
            </Badge>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          hint={calendarContent.metrics.scheduleRows.hint}
          label={calendarContent.metrics.scheduleRows.label}
          tone="default"
          value={String(calendar.draws.length)}
        />
        <MetricCard
          hint={calendarContent.metrics.monthlyInsights.hint}
          label={calendarContent.metrics.monthlyInsights.label}
          value={String(calendar.monthlyInsights.length)}
        />
        <MetricCard
          hint={calendarContent.metrics.generated.hint}
          label={calendarContent.metrics.generated.label}
          value={new Date(calendar.generatedAt).toLocaleDateString("th-TH")}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="p-6">
          <SectionHeading
            eyebrow={calendarContent.cards.schedule.eyebrow}
            title={calendarContent.cards.schedule.title}
            description={calendarContent.cards.schedule.description}
          />

          {state === "error" ? (
            <div className="mt-5">
              <EmptyState
                description={calendarContent.emptyStates.calendarError.description}
                icon={<Clock3 />}
                title={calendarContent.emptyStates.calendarError.title}
              />
            </div>
          ) : null}

          {state === "empty" ? (
            <div className="mt-5">
              <EmptyState
                description={calendarContent.emptyStates.calendar.description}
                icon={<CalendarDays />}
                title={calendarContent.emptyStates.calendar.title}
              />
            </div>
          ) : null}

          {state === "ready" ? (
            <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
              <Table>
                <TableHeader className="bg-[var(--color-bg-subtle)]">
                  <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      {calendarContent.scheduleTable.headers.date}
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      {calendarContent.scheduleTable.headers.drawNumber}
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      {calendarContent.scheduleTable.headers.status}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calendar.draws.map((draw) => (
                    <TableRow
                      className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                      key={draw.id}
                    >
                      <TableCell className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="size-4 text-[var(--color-text-muted)]" />
                          {draw.drawDate}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {draw.drawNo ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={draw.status === "upcoming" ? "brand" : "neutral"}>
                            {draw.status}
                          </Badge>
                          {draw.isNextDraw ? (
                            <Badge variant="success">{calendarContent.badges.nextDraw}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={calendarContent.cards.context.eyebrow}
            title={calendarContent.cards.context.title}
            description={calendarContent.cards.context.description}
          />
          <div className="mt-5 space-y-3">
            <MetricCard
              hint={calendarContent.metrics.timingAnchor.hint}
              label={calendarContent.metrics.timingAnchor.label}
              value={calendarContent.metrics.timingAnchor.value}
            />
            <MetricCard
              hint={calendarContent.metrics.insightBasis.hint}
              label={calendarContent.metrics.insightBasis.label}
              value={calendarContent.metrics.insightBasis.value}
            />
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow={calendarContent.monthlyInsights.eyebrow}
          title={calendarContent.monthlyInsights.title}
          description={calendarContent.monthlyInsights.description}
        />
        <div className="mt-4">
          <Button asChild className="px-0" variant="link">
            <Link href={calendarContent.actions.methodologyHref}>
              {calendarContent.actions.monthlyMethodologyLabel}
            </Link>
          </Button>
        </div>

        {calendar.monthlyInsights.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              description={calendarContent.emptyStates.monthlyInsights.description}
              icon={<Clock3 />}
              title={calendarContent.emptyStates.monthlyInsights.title}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {calendar.monthlyInsights.map((insight) => (
              <Card className="p-5" key={insight.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--calendar)]">
                      {insight.label}
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-normal text-[var(--color-text-primary)]">
                      {insight.sampleSize} draws
                    </h2>
                  </div>
                  <Sparkles className="size-5 text-[var(--calendar)]" />
                </div>

                <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {insight.summary}
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-none bg-[var(--color-bg-subtle)] p-3">
                    <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      {calendarContent.fallbackLabels.hotNumbers}
                    </p>
                    <p className="mt-2 font-mono text-sm text-[var(--color-text-primary)]">
                      {insight.hotNumbers.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-none bg-[var(--color-bg-subtle)] p-3">
                    <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      {calendarContent.fallbackLabels.coldNumbers}
                    </p>
                    <p className="mt-2 font-mono text-sm text-[var(--color-text-primary)]">
                      {insight.coldNumbers.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {insight.patternNotes.map((note) => (
                    <Badge key={note} variant="neutral">
                      {note}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
