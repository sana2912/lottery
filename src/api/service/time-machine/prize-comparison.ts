import type { LotteryPrizeType } from "@/generated/prisma/enums";
import type { TimeMachineSegment } from "@/schema/app/time-machine.schema";

export type PrizeComparisonRule = {
  comparisonLength: number;
  prizeTypes: readonly LotteryPrizeType[];
  segment: TimeMachineSegment;
};

export const ELIGIBLE_PRIZE_TYPES = [
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "THREE_FRONT",
  "THREE_BACK",
  "THREE_DIGIT",
  "TWO_DIGIT"
] as const satisfies readonly LotteryPrizeType[];

export type EligiblePrizeType = (typeof ELIGIBLE_PRIZE_TYPES)[number];

const SIX_DIGIT_PRIZE_TYPES = [
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5"
] as const satisfies readonly EligiblePrizeType[];

export const PRIZE_COMPARISON_RULES: readonly PrizeComparisonRule[] = [
  {
    comparisonLength: 6,
    prizeTypes: SIX_DIGIT_PRIZE_TYPES,
    segment: "full6"
  },
  {
    comparisonLength: 3,
    prizeTypes: ["THREE_FRONT"],
    segment: "front3"
  },
  {
    comparisonLength: 3,
    prizeTypes: ["THREE_BACK", "THREE_DIGIT"],
    segment: "back3"
  },
  {
    comparisonLength: 2,
    prizeTypes: ["TWO_DIGIT"],
    segment: "last2"
  }
];

export function isEligiblePrizeType(type: string): type is EligiblePrizeType {
  return (ELIGIBLE_PRIZE_TYPES as readonly string[]).includes(type);
}

export function getComparisonRule(prizeType: string): PrizeComparisonRule | undefined {
  return PRIZE_COMPARISON_RULES.find((rule) =>
    (rule.prizeTypes as readonly string[]).includes(prizeType)
  );
}

export function extractTicketSegment(ticket: string, segment: TimeMachineSegment): string {
  switch (segment) {
    case "full6":
      return ticket;
    case "front3":
      return ticket.slice(0, 3);
    case "back3":
      return ticket.slice(3, 6);
    case "last2":
      return ticket.slice(4, 6);
  }
}

export function normalizePrizeNumber(number: string, comparisonLength: number): string {
  const digits = number.replace(/\D/g, "");

  if (digits.length === comparisonLength) {
    return digits;
  }

  if (digits.length > comparisonLength) {
    return digits.slice(-comparisonLength);
  }

  return digits.padStart(comparisonLength, "0");
}

export type SegmentComparisonResult = {
  comparisonLength: number;
  digitDistance: number;
  isExactHit: boolean;
  matchedDigits: number;
  matchedPositions: number[];
  prizeSegment: string;
  segment: TimeMachineSegment;
  ticketSegment: string;
};

export function compareTicketToPrize(input: {
  prizeNumber: string;
  prizeType: string;
  ticket: string;
}): SegmentComparisonResult | null {
  const rule = getComparisonRule(input.prizeType);

  if (!rule) {
    return null;
  }

  const ticketSegment = extractTicketSegment(input.ticket, rule.segment);
  const prizeSegment = normalizePrizeNumber(input.prizeNumber, rule.comparisonLength);
  const matchedPositions = getMatchedPositions(ticketSegment, prizeSegment, rule.segment);
  const matchedDigits = matchedPositions.length;
  const digitDistance = rule.comparisonLength - matchedDigits;

  return {
    comparisonLength: rule.comparisonLength,
    digitDistance,
    isExactHit: matchedDigits === rule.comparisonLength,
    matchedDigits,
    matchedPositions,
    prizeSegment,
    segment: rule.segment,
    ticketSegment
  };
}

function getMatchedPositions(
  ticketSegment: string,
  prizeSegment: string,
  segment: TimeMachineSegment
): number[] {
  const positions: number[] = [];

  if (segment === "back3" || segment === "last2") {
    const ticketOffset = segment === "back3" ? 3 : 4;

    for (let index = 0; index < ticketSegment.length; index += 1) {
      if (ticketSegment[index] === prizeSegment[index]) {
        positions.push(ticketOffset + index);
      }
    }

    return positions;
  }

  for (let index = 0; index < ticketSegment.length; index += 1) {
    if (ticketSegment[index] === prizeSegment[index]) {
      positions.push(index);
    }
  }

  return positions;
}
