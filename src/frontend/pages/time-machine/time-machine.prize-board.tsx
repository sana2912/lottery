"use client";

import {
  type DrawPrizeSection,
  getHitTicketsForPrize,
  isFirstPrizeNearMissRow,
  isPrizeRowHit
} from "@/frontend/pages/time-machine/time-machine.mappers";
import { cn } from "@/lib/app/cn";
import type {
  TimeMachineDrawPrize,
  TimeMachineHitEvent,
  TimeMachineNearMissEvent
} from "@/schema/app/time-machine.schema";

type TimeMachinePrizeBoardProps = Readonly<{
  hits: readonly TimeMachineHitEvent[];
  nearMiss: TimeMachineNearMissEvent | undefined;
  sections: readonly DrawPrizeSection[];
}>;

export function TimeMachinePrizeBoard({ hits, nearMiss, sections }: TimeMachinePrizeBoardProps) {
  return (
    <div className="mt-6 space-y-4">
      {sections.map((section) => (
        <PrizeSectionBlock hits={hits} key={section.type} nearMiss={nearMiss} section={section} />
      ))}
    </div>
  );
}

type PrizeSectionBlockProps = Readonly<{
  hits: readonly TimeMachineHitEvent[];
  nearMiss: TimeMachineNearMissEvent | undefined;
  section: DrawPrizeSection;
}>;

function PrizeSectionBlock({ hits, nearMiss, section }: PrizeSectionBlockProps) {
  const isHero = section.prominence === "hero";
  const isCompact = section.prominence === "compact";

  return (
    <section
      className={cn(
        "rounded-none border border-[var(--color-border-soft)] p-3 md:p-4",
        isHero && "border-[var(--secondary)]/35 bg-[var(--color-bg-subtle)]/80 py-4 md:py-5",
        !isHero && "bg-[var(--color-surface)]/60"
      )}
    >
      <h3
        className={cn(
          "font-bold uppercase tracking-normal text-[var(--color-text-muted)]",
          isHero ? "text-sm" : "text-xs"
        )}
      >
        {section.title}
      </h3>
      <div
        className={cn(
          "mt-3 gap-2",
          isHero ? "flex flex-col items-center" : "grid",
          isCompact ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {section.prizes.map((prize) => (
          <PrizeCell
            hits={hits}
            isHero={isHero}
            key={`${prize.type}-${prize.number}-${prize.position ?? 0}`}
            nearMiss={nearMiss}
            prize={prize}
          />
        ))}
      </div>
    </section>
  );
}

type PrizeCellProps = Readonly<{
  hits: readonly TimeMachineHitEvent[];
  isHero: boolean;
  nearMiss: TimeMachineNearMissEvent | undefined;
  prize: TimeMachineDrawPrize;
}>;

function PrizeCell({ hits, isHero, nearMiss, prize }: PrizeCellProps) {
  const rowHit = isPrizeRowHit(prize, hits);
  const firstNearMiss = isFirstPrizeNearMissRow(prize, nearMiss);
  const hitTickets = getHitTicketsForPrize(prize, hits);
  const showPosition = prize.position !== undefined && !isHero;

  return (
    <div
      className={cn(
        "rounded-none border px-3 py-2",
        rowHit && "border-[var(--success)] bg-[var(--success-soft)]/60",
        firstNearMiss && !rowHit && "border-[var(--secondary)] bg-[var(--secondary-soft)]/50",
        !rowHit &&
          !firstNearMiss &&
          "border-[var(--color-border-soft)]/80 bg-[var(--color-bg-canvas)]",
        isHero &&
          "w-full max-w-md border-[var(--color-border-soft)] bg-[var(--color-surface)] px-6 py-4 text-center"
      )}
    >
      {showPosition ? (
        <p className="text-[10px] font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
          #{prize.position}
        </p>
      ) : null}
      <span
        className={cn(
          "font-mono font-semibold tabular-nums",
          isHero ? "text-4xl md:text-5xl" : "text-lg",
          rowHit
            ? "text-[var(--success)]"
            : firstNearMiss
              ? "text-[var(--secondary)]"
              : "text-[var(--color-text-primary)]"
        )}
      >
        {prize.number}
      </span>
      {hitTickets.length > 0 ? (
        <p className="mt-1 text-xs text-[var(--success)]">({hitTickets.join(", ")})</p>
      ) : null}
      {!isHero && prize.label.includes("#") ? (
        <p className="mt-0.5 truncate text-[10px] text-[var(--color-text-muted)]">{prize.label}</p>
      ) : null}
    </div>
  );
}
