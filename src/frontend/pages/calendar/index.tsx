import { CalendarDays, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";
import { EmptyState, MetricCard } from "@/frontend/components";
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
import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type CalendarReadModel, calendarReadModelSchema } from "@/schema/app/calendar.schema";

const calendarFallback = calendarReadModelSchema.parse({
  generatedAt: "2026-04-28T00:00:00.000Z",
  monthlyInsights: [
    {
      coldNumbers: ["03", "91"],
      hotNumbers: ["47", "24"],
      id: "monthly-insight-may",
      label: "May",
      month: 5,
      patternNotes: [
        "Odd-ending numbers appeared slightly more often in the sampled month.",
        "High-ending numbers carried more weight in same-month history."
      ],
      sampleSize: 12,
      summary:
        "May has 12 historical draws in sample, leaning toward odd-ending and high-ending numbers."
    }
  ],
  nextDraw: {
    drawDate: "1 May 2026",
    drawDateIso: "2026-05-01T00:00:00.000Z",
    drawNo: "17/2026",
    id: "draw-2026-05-01",
    isNextDraw: true,
    status: "upcoming"
  },
  draws: [
    {
      drawDate: "1 May 2026",
      drawDateIso: "2026-05-01T00:00:00.000Z",
      drawNo: "17/2026",
      id: "draw-2026-05-01",
      isNextDraw: true,
      status: "upcoming"
    },
    {
      drawDate: "16 April 2026",
      drawDateIso: "2026-04-16T00:00:00.000Z",
      drawNo: "16/2026",
      id: "draw-2026-04-16",
      isNextDraw: false,
      status: "past"
    }
  ],
  source: "mock"
});

async function getCalendarModel(): Promise<CalendarReadModel> {
  try {
    return await apiGet<CalendarReadModel>(apiRoutes.calendar, {
      cache: "no-store",
      schema: calendarReadModelSchema
    });
  } catch {
    return calendarFallback;
  }
}

export async function CalendarPage() {
  const calendar = await getCalendarModel();
  const nextDrawDate = new Date(calendar.nextDraw.drawDateIso);
  const now = new Date();
  const daysUntilNextDraw = Math.max(
    0,
    Math.ceil((nextDrawDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--calendar)]">
            Calendar
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            Draw rhythm and month-based signals
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            Track the next scheduled draw, review recent dates, and scan monthly patterns from the
            historical record used by the rest of the dashboard.
          </p>
          <div className="mt-4">
            <Button asChild className="px-0" variant="link">
              <Link href="/methodology#monthly-insights">
                Read how monthly insights should be interpreted
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Next draw" title={calendar.nextDraw.drawDate} />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint="Days remaining until the next scheduled draw date."
              label="Countdown"
              tone="default"
              value={`${daysUntilNextDraw} days`}
            />
            <MetricCard
              hint="Draw number label for the next scheduled run."
              label="Draw no."
              value={calendar.nextDraw.drawNo ?? "-"}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="brand">{calendar.nextDraw.status}</Badge>
            <Badge variant={calendar.source === "api" ? "success" : "warning"}>
              {calendar.source === "api" ? "Live API" : "Mock fallback"}
            </Badge>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          hint="Recent draw rows plus the upcoming scheduled draw."
          label="Schedule rows"
          tone="default"
          value={String(calendar.draws.length)}
        />
        <MetricCard
          hint="Monthly seasonal summaries currently exposed by the calendar read model."
          label="Monthly insights"
          value={String(calendar.monthlyInsights.length)}
        />
        <MetricCard
          hint="Timestamp when the calendar read model was generated."
          label="Generated"
          value={new Date(calendar.generatedAt).toLocaleDateString("th-TH")}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="p-6">
          <SectionHeading
            eyebrow="Schedule"
            title="Upcoming and recent draw dates"
            description="The next scheduled draw stays pinned at the top so users can orient around the next decision window."
          />

          <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
            <Table>
              <TableHeader className="bg-[var(--color-bg-subtle)]">
                <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    Date
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    Draw no.
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    Status
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
                        {draw.isNextDraw ? <Badge variant="success">Next draw</Badge> : null}
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
            eyebrow="Context"
            title="How to read this page"
            description="Calendar is the timing layer for the rest of the product. It does not predict outcomes by itself."
          />
          <div className="mt-5 space-y-3">
            <MetricCard
              hint="Calendar uses draw dates to anchor seasonality and timing windows."
              label="Timing anchor"
              value="Draw date"
            />
            <MetricCard
              hint="Monthly notes summarize historical patterns from the same month only."
              label="Insight basis"
              value="Month seasonality"
            />
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow="Monthly insights"
          title="Seasonal notes from the same month in prior draws"
          description="These cards are descriptive cues for timing and context. They are not guarantees."
        />
        <div className="mt-4">
          <Button asChild className="px-0" variant="link">
            <Link href="/methodology#monthly-insights">
              Review sample-size and uncertainty guidance
            </Link>
          </Button>
        </div>

        {calendar.monthlyInsights.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              description="No monthly insight rows are available in the current calendar read model."
              icon={<Clock3 />}
              title="No monthly insights"
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
                      Hot numbers
                    </p>
                    <p className="mt-2 font-mono text-sm text-[var(--color-text-primary)]">
                      {insight.hotNumbers.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-none bg-[var(--color-bg-subtle)] p-3">
                    <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      Cold numbers
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
