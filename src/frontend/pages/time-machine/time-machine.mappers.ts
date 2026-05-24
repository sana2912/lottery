import { timeMachineContent } from "@/frontend/pages/time-machine/time-machine.content";
import type {
  TimeMachineChartPoint,
  TimeMachineDrawPrize,
  TimeMachineHitEvent,
  TimeMachineNearMissEvent,
  TimeMachineTimelineEvent
} from "@/schema/app/time-machine.schema";

export type TimeMachineFormState = {
  startYear: string;
  tickets: string[];
};

export type TicketHighlightState = {
  hit: boolean;
  nearMiss: boolean;
  nearMissMatchedIndexes: number[];
  nearMissMissedIndex: number | null;
};

export type DrawPrizeSectionProminence = "hero" | "primary" | "compact";

export type DrawPrizeSection = {
  prizes: TimeMachineDrawPrize[];
  prominence: DrawPrizeSectionProminence;
  title: string;
  type: string;
};

export type HitRewardItem = {
  drawDateLabel: string;
  hit: TimeMachineHitEvent;
  prizeLabel: string;
  year: number;
};

const PRIZE_SECTION_ORDER = [
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "THREE_DIGIT",
  "THREE_FRONT",
  "THREE_BACK",
  "TWO_DIGIT"
] as const;

const PRIZE_SECTION_PROMINENCE: Record<string, DrawPrizeSectionProminence> = {
  FIRST: "hero",
  NEAR_FIRST: "primary",
  PRIZE2: "primary",
  PRIZE3: "primary",
  PRIZE4: "primary",
  PRIZE5: "primary",
  THREE_DIGIT: "compact",
  THREE_FRONT: "compact",
  THREE_BACK: "compact",
  TWO_DIGIT: "compact"
};

export const defaultTimeMachineFormState: TimeMachineFormState = {
  startYear: "1992",
  tickets: ["", "", "", ""]
};

export function normalizeTicketInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isValidTicket(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function getFilledTickets(tickets: readonly string[]): string[] {
  return tickets.map((ticket) => ticket.trim()).filter(isValidTicket);
}

export function randomSixDigit(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export function toTimeMachinePayload(formState: TimeMachineFormState) {
  return {
    lotteryType: "THAI_GOVERNMENT" as const,
    startYear: Number(formState.startYear),
    tickets: getFilledTickets(formState.tickets)
  };
}

export function toScoreChartPoints(
  points: readonly TimeMachineChartPoint[]
): TimeMachineChartPoint[] {
  return points.map((point) => ({
    id: point.id,
    label: point.label,
    value: point.value
  }));
}

export function formatResearchScore(value: number): string {
  return value.toLocaleString("th-TH");
}

export function groupDrawPrizesIntoSections(
  prizes: readonly TimeMachineDrawPrize[]
): DrawPrizeSection[] {
  const grouped = new Map<string, TimeMachineDrawPrize[]>();

  for (const prize of prizes) {
    const bucket = grouped.get(prize.type) ?? [];
    bucket.push(prize);
    grouped.set(prize.type, bucket);
  }

  return PRIZE_SECTION_ORDER.filter((type) => grouped.has(type)).map((type) => ({
    prizes: grouped.get(type) ?? [],
    prominence: PRIZE_SECTION_PROMINENCE[type] ?? "compact",
    title: getPrizeSectionTitle(type),
    type
  }));
}

export function getPrizeLabelForHit(
  hit: TimeMachineHitEvent,
  drawPrizes: readonly TimeMachineDrawPrize[]
): string {
  const match = drawPrizes.find(
    (prize) => prize.type === hit.prizeType && normalizePrizeNumber(prize) === hit.prizeNumber
  );

  if (match) {
    return match.label;
  }

  return getPrizeSectionTitle(hit.prizeType);
}

export function buildHitRewardItems(event: TimeMachineTimelineEvent): HitRewardItem[] {
  const hits = event.hits ?? [];

  if (hits.length === 0) {
    return [];
  }

  return hits.map((hit) => ({
    drawDateLabel: event.drawDateLabel,
    hit,
    prizeLabel: getPrizeLabelForHit(hit, event.drawPrizes),
    year: event.year
  }));
}

function getPrizeSectionTitle(type: string): string {
  const sections = timeMachineContent.prizeSections;

  if (type in sections) {
    return sections[type as keyof typeof sections];
  }

  return type;
}

export function isPrizeRowHit(
  prize: TimeMachineDrawPrize,
  hits: readonly TimeMachineHitEvent[]
): boolean {
  return hits.some(
    (hit) => hit.prizeType === prize.type && hit.prizeNumber === normalizePrizeNumber(prize)
  );
}

export function getHitTicketsForPrize(
  prize: TimeMachineDrawPrize,
  hits: readonly TimeMachineHitEvent[]
): string[] {
  return [
    ...new Set(
      hits
        .filter(
          (hit) => hit.prizeType === prize.type && hit.prizeNumber === normalizePrizeNumber(prize)
        )
        .map((hit) => hit.ticket)
    )
  ];
}

export function getTicketHighlightState(
  ticket: string,
  event: TimeMachineTimelineEvent | null
): TicketHighlightState {
  const hits = event?.hits ?? [];
  const hit = hits.some((item) => item.ticket === ticket);
  const nearMiss = event?.nearMiss?.ticket === ticket;

  if (!nearMiss || !event?.nearMiss) {
    return {
      hit,
      nearMiss: false,
      nearMissMatchedIndexes: [],
      nearMissMissedIndex: null
    };
  }

  const matched = event.nearMiss.matchedPositions;
  const missedIndex = findMissedDigitIndex(ticket, matched);

  return {
    hit,
    nearMiss: true,
    nearMissMatchedIndexes: matched,
    nearMissMissedIndex: missedIndex
  };
}

export function isFirstPrizeNearMissRow(
  prize: TimeMachineDrawPrize,
  nearMiss: TimeMachineNearMissEvent | undefined
): boolean {
  return prize.type === "FIRST" && nearMiss !== undefined;
}

function normalizePrizeNumber(prize: TimeMachineDrawPrize): string {
  const digits = prize.number.replace(/\D/g, "");

  switch (prize.type) {
    case "TWO_DIGIT":
      return digits.slice(-2);
    case "THREE_FRONT":
      return digits.slice(0, 3);
    case "THREE_BACK":
    case "THREE_DIGIT":
      return digits.slice(-3);
    default:
      return digits.length > 6 ? digits.slice(-6) : digits;
  }
}

function findMissedDigitIndex(ticket: string, matchedPositions: readonly number[]): number | null {
  for (let index = 0; index < ticket.length; index += 1) {
    if (!matchedPositions.includes(index)) {
      return index;
    }
  }

  return null;
}

export function pickStrongestNearMissEvent(
  events: readonly TimeMachineNearMissEvent[]
): TimeMachineNearMissEvent | undefined {
  if (events.length === 0) {
    return undefined;
  }

  return [...events].sort((left, right) => right.matchedDigits - left.matchedDigits)[0];
}
