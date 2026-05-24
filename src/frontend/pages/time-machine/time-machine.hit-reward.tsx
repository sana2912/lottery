"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { timeMachineContent } from "@/frontend/pages/time-machine/time-machine.content";
import {
  buildHitRewardItems,
  formatResearchScore,
  type HitRewardItem
} from "@/frontend/pages/time-machine/time-machine.mappers";
import type { TimeMachineTimelineEvent } from "@/schema/app/time-machine.schema";

const REWARD_VISIBLE_MS = 2_800;

type TimeMachineHitRewardProps = Readonly<{
  activeEvent: TimeMachineTimelineEvent | null;
  eventIndex: number;
}>;

export function TimeMachineHitReward({ activeEvent, eventIndex }: TimeMachineHitRewardProps) {
  const [prevEventIndex, setPrevEventIndex] = useState(eventIndex);
  const [lastEnqueuedDrawId, setLastEnqueuedDrawId] = useState<string | null>(null);
  const [queue, setQueue] = useState<HitRewardItem[]>([]);
  const [current, setCurrent] = useState<HitRewardItem | null>(null);

  if (eventIndex !== prevEventIndex) {
    if (eventIndex === 0 && prevEventIndex > 0) {
      setLastEnqueuedDrawId(null);
      setQueue([]);
      setCurrent(null);
    }

    setPrevEventIndex(eventIndex);
  }

  const drawId = activeEvent?.drawId ?? null;

  if (drawId !== null && activeEvent !== null && drawId !== lastEnqueuedDrawId) {
    setLastEnqueuedDrawId(drawId);
    const items = buildHitRewardItems(activeEvent);

    if (items.length > 0) {
      setQueue((pending) => [...pending, ...items]);
    }
  }

  if (current === null && queue.length > 0) {
    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
  }

  useEffect(() => {
    if (!current) {
      return;
    }

    const timer = window.setTimeout(() => setCurrent(null), REWARD_VISIBLE_MS);

    return () => window.clearTimeout(timer);
  }, [current]);

  if (!current) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4">
      <div className="w-full max-w-sm rounded-none border border-[var(--success)]/40 bg-[var(--color-surface)]/95 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-none bg-[var(--success-soft)] text-[var(--success)]">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--success)]">
              {timeMachineContent.hitReward.title}
            </p>
            <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
              {current.prizeLabel}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {timeMachineContent.hitReward.drawLabel} {current.drawDateLabel} ·{" "}
              {timeMachineContent.hitReward.yearLabel} {current.year}
            </p>
            <p className="mt-2 font-mono text-sm text-[var(--color-text-primary)]">
              {timeMachineContent.hitReward.ticketLabel}: {current.hit.ticket}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {timeMachineContent.hitReward.pointsLabel} {formatResearchScore(current.hit.points)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
