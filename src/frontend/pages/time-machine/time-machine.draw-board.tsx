"use client";

import Link from "next/link";
import { timeMachineContent } from "@/frontend/pages/time-machine/time-machine.content";
import {
  formatResearchScore,
  getTicketHighlightState,
  groupDrawPrizesIntoSections
} from "@/frontend/pages/time-machine/time-machine.mappers";
import { TimeMachinePrizeBoard } from "@/frontend/pages/time-machine/time-machine.prize-board";
import { Card } from "@/frontend/primitives";
import { cn } from "@/lib/app/cn";
import type {
  TimeMachineTicketShape,
  TimeMachineTimelineEvent
} from "@/schema/app/time-machine.schema";

type TimeMachineDrawBoardProps = Readonly<{
  activeEvent: TimeMachineTimelineEvent | null;
  runningScore: number;
  tickets: readonly TimeMachineTicketShape[];
}>;

const DIGIT_SLOT_IDS = ["d1", "d2", "d3", "d4", "d5", "d6"] as const;

export function TimeMachineDrawBoard({
  activeEvent,
  runningScore,
  tickets
}: TimeMachineDrawBoardProps) {
  const hits = activeEvent?.hits ?? [];
  const nearMiss = activeEvent?.nearMiss;
  const sections = groupDrawPrizesIntoSections(activeEvent?.drawPrizes ?? []);

  return (
    <div className="pointer-events-auto relative z-20 mx-auto flex w-full max-w-4xl flex-col px-4 py-6 md:px-6">
      <Card className="border-[var(--color-border-soft)]/80 bg-[var(--color-surface)]/92 p-5 backdrop-blur-md md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border-soft)] pb-4">
          <div>
            <p className="text-xs uppercase tracking-normal text-[var(--color-text-muted)]">
              {timeMachineContent.board.yearPrefix} {activeEvent?.year ?? "-"}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">
              {activeEvent?.drawDateLabel ?? "-"}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-normal text-[var(--color-text-muted)]">
              {timeMachineContent.board.score}
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums text-[var(--secondary)]">
              {formatResearchScore(runningScore)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-normal text-[var(--color-text-muted)]">
            {timeMachineContent.board.ticketsTitle}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tickets.map((ticket) => (
              <TicketChip
                highlight={getTicketHighlightState(ticket.number, activeEvent)}
                key={ticket.number}
                number={ticket.number}
              />
            ))}
          </div>
        </div>

        {nearMiss ? (
          <p className="mt-4 text-sm text-[var(--secondary)]">{nearMiss.cinematicCopy}</p>
        ) : null}

        <div className="mt-2">
          <p className="mb-1 text-xs uppercase tracking-normal text-[var(--color-text-muted)]">
            {timeMachineContent.board.prizesTitle}
          </p>
          <TimeMachinePrizeBoard hits={hits} nearMiss={nearMiss} sections={sections} />
        </div>

        {activeEvent ? (
          <div className="mt-4 border-t border-[var(--color-border-soft)] pt-4">
            <Link
              className="text-sm text-[var(--secondary)] underline-offset-4 hover:underline"
              href={`/results/${activeEvent.drawId}`}
            >
              {timeMachineContent.actions.inspectDraw}
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

type TicketChipProps = Readonly<{
  highlight: ReturnType<typeof getTicketHighlightState>;
  number: string;
}>;

function TicketChip({ highlight, number }: TicketChipProps) {
  const slotIds = DIGIT_SLOT_IDS.slice(0, number.length);

  return (
    <div
      className={cn(
        "rounded-none border px-3 py-2 font-mono text-sm tabular-nums",
        highlight.hit
          ? "border-[var(--success)] bg-[var(--success-soft)]"
          : highlight.nearMiss
            ? "border-[var(--secondary)] bg-[var(--secondary-soft)]"
            : "border-[var(--color-border-soft)] bg-[var(--color-surface)]"
      )}
    >
      {slotIds.map((slotId, index) => {
        const digit = number[index] ?? "";

        return (
          <span
            className={cn(
              highlight.hit
                ? "text-[var(--success)]"
                : highlight.nearMissMatchedIndexes.includes(index)
                  ? "text-[var(--secondary)]"
                  : highlight.nearMissMissedIndex === index
                    ? "text-[var(--danger)]"
                    : "text-[var(--color-text-primary)]"
            )}
            key={`${number}-${slotId}`}
          >
            {digit}
          </span>
        );
      })}
    </div>
  );
}
