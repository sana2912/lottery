"use client";

import { Clock3, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { TimeSeriesChart } from "@/frontend/chart-primitives";
import { EmptyState, MetricCard } from "@/frontend/components";
import { timeMachineContent } from "@/frontend/pages/time-machine/time-machine.content";
import {
  formatResearchScore,
  type TimeMachineFormState,
  toScoreChartPoints
} from "@/frontend/pages/time-machine/time-machine.mappers";
import { Button, Card, Input, Label, SectionHeading } from "@/frontend/primitives";
import type { TimeMachineSimulationResponse } from "@/schema/app/time-machine.schema";

type SetupScreenProps = Readonly<{
  formState: TimeMachineFormState;
  isPending: boolean;
  onClear: () => void;
  onRandomFill: () => void;
  onStart: () => void;
  onTicketChange: (index: number, value: string) => void;
}>;

const TICKET_SLOT_IDS = [
  "ticket-slot-1",
  "ticket-slot-2",
  "ticket-slot-3",
  "ticket-slot-4"
] as const;

export function TimeMachineSetupScreen({
  formState,
  isPending,
  onClear,
  onRandomFill,
  onStart,
  onTicketChange
}: SetupScreenProps) {
  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--secondary)]">
            {timeMachineContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {timeMachineContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {timeMachineContent.hero.description}
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={timeMachineContent.sections.setup.eyebrow}
            title={timeMachineContent.sections.setup.title}
          />
          <div className="mt-6 space-y-4">
            {TICKET_SLOT_IDS.map((slotId, index) => (
              <div key={slotId}>
                <Label htmlFor={`ticket-${index}`}>
                  {timeMachineContent.sections.tickets.title} {index + 1}
                </Label>
                <Input
                  className="mt-2 font-mono text-lg tracking-widest"
                  id={`ticket-${index}`}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => onTicketChange(index, event.target.value)}
                  placeholder="123456"
                  value={formState.tickets[index] ?? ""}
                />
              </div>
            ))}
            <p className="text-sm text-[var(--color-text-muted)]">
              {timeMachineContent.sections.tickets.hint}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={isPending} onClick={onRandomFill} type="button" variant="outline">
                <Sparkles className="size-4" />
                {timeMachineContent.actions.randomFill}
              </Button>
              <Button disabled={isPending} onClick={onClear} type="button" variant="outline">
                {timeMachineContent.actions.clearTickets}
              </Button>
              <Button disabled={isPending} onClick={onStart} type="button">
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Clock3 className="size-4" />
                )}
                {timeMachineContent.actions.start}
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

type SummaryScreenProps = Readonly<{
  onReplay: () => void;
  simulation: TimeMachineSimulationResponse;
}>;

export function TimeMachineSummaryScreen({ onReplay, simulation }: SummaryScreenProps) {
  const { summary } = simulation;

  return (
    <main className="relative z-20 space-y-6 p-4 md:p-6">
      <Card className="p-6 md:p-8">
        <SectionHeading
          eyebrow={timeMachineContent.sections.summary.eyebrow}
          title={timeMachineContent.sections.summary.title}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            hint="คะแนนวิจัยรวมจากการเดินทางย้อนเวลา"
            label={timeMachineContent.sections.summary.totalScore}
            value={formatResearchScore(summary.totalScore)}
          />
          <MetricCard
            hint={`ถูกรางวัลทั้งหมด ${summary.hitCounts.total} ครั้ง`}
            label={timeMachineContent.sections.summary.hits}
            value={String(summary.hitCounts.total)}
          />
          <MetricCard
            hint="จำนวนงวดที่ไม่มี hit หรือ near miss"
            label={timeMachineContent.sections.summary.longestQuiet}
            value={String(summary.longestQuietStreak)}
          />
          <MetricCard
            hint="ใกล้รางวัลที่ 1 มากที่สุด"
            label={timeMachineContent.sections.summary.bestNearMiss}
            value={summary.bestNearMiss?.cinematicCopy ?? "-"}
          />
        </div>
      </Card>

      <TimeSeriesChart
        points={toScoreChartPoints(summary.chartScoreByYear)}
        title={timeMachineContent.sections.summary.scoreChart}
      />

      <Card className="p-6">
        {summary.closestFirstMoment ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {summary.closestFirstMoment.cinematicCopy} ({summary.closestFirstMoment.ticket})
          </p>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">ไม่มีช่วงใกล้รางวัลที่ 1</p>
        )}
        <Button className="mt-6" onClick={onReplay} type="button">
          <RotateCcw className="size-4" />
          {timeMachineContent.actions.replay}
        </Button>
      </Card>
    </main>
  );
}

type ErrorBannerProps = Readonly<{
  message: string;
}>;

export function TimeMachineErrorBanner({ message }: ErrorBannerProps) {
  return (
    <Card className="border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4">
      <p className="text-sm text-[var(--danger)]">{message}</p>
    </Card>
  );
}

type EmptySimulationProps = Readonly<{
  message?: string;
}>;

export function TimeMachineEmptySimulation({ message }: EmptySimulationProps) {
  return (
    <EmptyState
      description={message ?? timeMachineContent.emptyState.description}
      title={timeMachineContent.emptyState.title}
    />
  );
}
