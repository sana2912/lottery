import {
  getLotterySurvivalPrizeLabel,
  getLotterySurvivalPrizePayout
} from "@/api/service/lottery-survival/constants";
import {
  compareTicketToPrize,
  isEligiblePrizeType
} from "@/api/service/time-machine/prize-comparison";
import type {
  LotterySurvivalHit,
  LotterySurvivalNearMiss,
  LotterySurvivalPrize,
  LotterySurvivalTicketPreviewItem,
  LotterySurvivalWinBreakdown
} from "@/schema/app/lottery-survival.schema";

export type LotterySurvivalDrawRecord = {
  drawDate: Date | string;
  drawNo?: null | string;
  id: string;
  prizes: readonly LotterySurvivalRawPrize[];
  sourceStatus: "IMPORTED" | "PARTIAL" | "VERIFIED";
};

export type LotterySurvivalRawPrize = {
  number: string;
  position?: null | number;
  type: string;
};

type DisplayableLotterySurvivalPrize = LotterySurvivalRawPrize & {
  type: LotterySurvivalPrize["type"];
};

export type LotterySurvivalRoundScore = {
  nearMisses: LotterySurvivalNearMiss[];
  prizeTotal: number;
  winBreakdown: LotterySurvivalWinBreakdown;
  winningTickets: LotterySurvivalHit[];
};

const MAX_NEAR_MISSES = 12;

type WinBreakdownAccumulator = {
  prizeLabel: string;
  prizeType: LotterySurvivalPrize["type"];
  rawMatchCount: number;
  subtotal: number;
};

export function scoreLotterySurvivalRound(input: {
  draw: LotterySurvivalDrawRecord;
  tickets: readonly LotterySurvivalTicketPreviewItem[];
}): LotterySurvivalRoundScore {
  const ticketCounts = countTickets(input.tickets);
  const hitByKey = new Map<string, LotterySurvivalHit>();
  const rawBreakdownByPrizeType = new Map<LotterySurvivalPrize["type"], WinBreakdownAccumulator>();
  const nearMissCandidates: LotterySurvivalNearMiss[] = [];

  for (const [ticket, quantity] of ticketCounts.entries()) {
    for (const prize of input.draw.prizes) {
      if (!isPayablePrize(prize)) {
        continue;
      }

      const comparison = compareTicketToPrize({
        prizeNumber: prize.number,
        prizeType: prize.type,
        ticket
      });

      if (!comparison) {
        continue;
      }

      if (comparison.isExactHit) {
        const prizeAmount = getLotterySurvivalPrizePayout(prize.type);
        const key = `${ticket}:${prize.type}:${comparison.prizeSegment}:${comparison.segment}`;
        const current = hitByKey.get(key);
        const totalPrize = prizeAmount * quantity;
        const currentBreakdown = rawBreakdownByPrizeType.get(prize.type);

        rawBreakdownByPrizeType.set(prize.type, {
          prizeLabel: currentBreakdown?.prizeLabel ?? getLotterySurvivalPrizeLabel(prize.type),
          prizeType: prize.type,
          rawMatchCount: (currentBreakdown?.rawMatchCount ?? 0) + quantity,
          subtotal: (currentBreakdown?.subtotal ?? 0) + totalPrize
        });

        if (current) {
          current.totalPrize += totalPrize;
          continue;
        }

        hitByKey.set(key, {
          matchedDigits: comparison.matchedDigits,
          prizeAmount,
          prizeLabel: getLotterySurvivalPrizeLabel(prize.type, prize.position ?? undefined),
          prizeNumber: comparison.prizeSegment,
          prizeType: prize.type,
          quantity,
          segment: comparison.segment,
          ticket,
          totalPrize
        });
        continue;
      }

      const nearMiss = toNearMiss({
        digitDistance: comparison.digitDistance,
        matchedDigits: comparison.matchedDigits,
        matchedPositions: comparison.matchedPositions,
        prizeNumber: comparison.prizeSegment,
        prizeType: prize.type,
        quantity,
        segment: comparison.segment,
        ticket
      });

      if (nearMiss) {
        nearMissCandidates.push(nearMiss);
      }
    }
  }

  const winningTickets = [...hitByKey.values()].sort(
    (left, right) => right.totalPrize - left.totalPrize
  );
  const prizeTotal = winningTickets.reduce((sum, hit) => sum + hit.totalPrize, 0);
  const winBreakdown = buildWinBreakdown({
    prizeTotal,
    rawBreakdownByPrizeType,
    winningTickets
  });

  return {
    nearMisses: summarizeNearMisses(nearMissCandidates),
    prizeTotal,
    winBreakdown,
    winningTickets
  };
}

export function toLotterySurvivalPrizes(
  prizes: readonly LotterySurvivalRawPrize[]
): LotterySurvivalPrize[] {
  return prizes
    .filter(isDisplayablePrize)
    .sort(sortPrizes)
    .map((prize) => ({
      label: getLotterySurvivalPrizeLabel(prize.type, prize.position ?? undefined),
      number: prize.number,
      position: prize.position ?? undefined,
      type: prize.type
    }));
}

export function isLotterySurvivalEligibleDraw(draw: LotterySurvivalDrawRecord): boolean {
  const hasFirstPrize = draw.prizes.some(
    (prize) => prize.type === "FIRST" && /^\d{6,7}$/.test(prize.number)
  );
  const hasTwoDigitPrize = draw.prizes.some(
    (prize) => prize.type === "TWO_DIGIT" && /^\d{2}$/.test(prize.number)
  );

  return hasFirstPrize && hasTwoDigitPrize;
}

function countTickets(tickets: readonly LotterySurvivalTicketPreviewItem[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const ticket of tickets) {
    counts.set(ticket.number, (counts.get(ticket.number) ?? 0) + 1);
  }

  return counts;
}

function buildWinBreakdown(input: {
  prizeTotal: number;
  rawBreakdownByPrizeType: ReadonlyMap<LotterySurvivalPrize["type"], WinBreakdownAccumulator>;
  winningTickets: readonly LotterySurvivalHit[];
}): LotterySurvivalWinBreakdown {
  const groupedCountByPrizeType = new Map<LotterySurvivalPrize["type"], number>();

  for (const hit of input.winningTickets) {
    groupedCountByPrizeType.set(
      hit.prizeType,
      (groupedCountByPrizeType.get(hit.prizeType) ?? 0) + 1
    );
  }

  const byPrizeType = [...input.rawBreakdownByPrizeType.values()]
    .sort((left, right) => getPrizeTypeOrder(left.prizeType) - getPrizeTypeOrder(right.prizeType))
    .map((item) => ({
      groupedEntryCount: groupedCountByPrizeType.get(item.prizeType) ?? 0,
      prizeLabel: item.prizeLabel,
      prizeType: item.prizeType,
      rawMatchCount: item.rawMatchCount,
      subtotal: item.subtotal
    }));

  return {
    byPrizeType,
    totalGroupedWinningEntries: input.winningTickets.length,
    totalPrizeMoney: input.prizeTotal,
    totalRawWinningMatches: byPrizeType.reduce((sum, item) => sum + item.rawMatchCount, 0)
  };
}

function isPayablePrize(prize: LotterySurvivalRawPrize): prize is DisplayableLotterySurvivalPrize {
  return isDisplayablePrize(prize) && getLotterySurvivalPrizePayout(prize.type) > 0;
}

function isDisplayablePrize(
  prize: LotterySurvivalRawPrize
): prize is DisplayableLotterySurvivalPrize {
  return isEligiblePrizeType(prize.type) && /^\d+$/.test(prize.number);
}

function toNearMiss(input: {
  digitDistance: number;
  matchedDigits: number;
  matchedPositions: number[];
  prizeNumber: string;
  prizeType: LotterySurvivalPrize["type"];
  quantity: number;
  segment: "back3" | "front3" | "full6" | "last2";
  ticket: string;
}): LotterySurvivalNearMiss | undefined {
  if (
    input.prizeType === "FIRST" &&
    input.segment === "full6" &&
    input.ticket.slice(1) === input.prizeNumber.slice(1) &&
    input.ticket !== input.prizeNumber
  ) {
    return buildNearMiss(input, {
      category: "FIRST_LAST_FIVE",
      description: `เลข ${input.ticket} ตรงท้าย 5 ตัวของรางวัลที่ 1 ${input.prizeNumber}`,
      label: "ตรงท้าย 5 ตัวของรางวัลที่ 1",
      severity: 105
    });
  }

  if (input.prizeType === "FIRST" && input.segment === "full6" && input.digitDistance === 1) {
    return buildNearMiss(input, {
      category: "FIRST_ONE_DIGIT",
      description: `เลข ${input.ticket} พลาดรางวัลที่ 1 ${input.prizeNumber} เพียง 1 หลัก`,
      label: "พลาดรางวัลที่ 1 เพียง 1 หลัก",
      severity: 100
    });
  }

  if (
    (input.prizeType === "THREE_FRONT" ||
      input.prizeType === "THREE_BACK" ||
      input.prizeType === "THREE_DIGIT") &&
    input.digitDistance === 1
  ) {
    return buildNearMiss(input, {
      category: "FRONT_OR_BACK_THREE",
      description: `เฉียดรางวัล 3 ตัว ${input.prizeNumber} ด้วยเลข ${input.ticket}`,
      label: "ใกล้เลขหน้า/ท้าย 3 ตัว",
      severity: 60
    });
  }

  if (input.prizeType === "TWO_DIGIT" && input.segment === "last2" && input.digitDistance === 1) {
    return buildNearMiss(input, {
      category: "LAST_TWO",
      description: `เลขท้ายของ ${input.ticket} เฉียดเลขท้าย 2 ตัว ${input.prizeNumber}`,
      label: "ใกล้เลขท้าย 2 ตัว",
      severity: 40
    });
  }

  return undefined;
}

function buildNearMiss(
  input: Parameters<typeof toNearMiss>[0],
  meta: Pick<LotterySurvivalNearMiss, "category" | "description" | "label" | "severity">
): LotterySurvivalNearMiss {
  return {
    ...meta,
    digitDistance: input.digitDistance,
    id: `${meta.category}:${input.ticket}:${input.prizeType}:${input.prizeNumber}`,
    matchedDigits: input.matchedDigits,
    matchedPositions: input.matchedPositions,
    prizeNumber: input.prizeNumber,
    prizeType: input.prizeType,
    quantity: input.quantity,
    ticket: input.ticket
  };
}

function summarizeNearMisses(
  nearMisses: readonly LotterySurvivalNearMiss[]
): LotterySurvivalNearMiss[] {
  const groupedByTicket = new Map<string, LotterySurvivalNearMiss[]>();

  for (const nearMiss of nearMisses) {
    const current = groupedByTicket.get(nearMiss.ticket) ?? [];
    current.push(nearMiss);
    groupedByTicket.set(nearMiss.ticket, current);
  }

  const multiNearMisses = [...groupedByTicket.entries()]
    .filter(([, items]) => items.length >= 3)
    .map(([ticket, items]) => {
      const strongest = sortNearMisses(items)[0] as LotterySurvivalNearMiss;

      return {
        ...strongest,
        category: "MULTIPLE_NEAR_MISSES" as const,
        description: `เลข ${ticket} มีหลายจังหวะที่เฉียดรางวัลในงวดเดียวกัน`,
        id: `MULTIPLE_NEAR_MISSES:${ticket}`,
        label: "หลายใบ/หลายจังหวะเกือบถูกรางวัล",
        severity: strongest.severity + 5
      };
    });

  return sortNearMisses([...multiNearMisses, ...nearMisses]).slice(0, MAX_NEAR_MISSES);
}

function sortNearMisses(items: readonly LotterySurvivalNearMiss[]): LotterySurvivalNearMiss[] {
  return [...items].sort((left, right) => {
    const severity = right.severity - left.severity;

    if (severity !== 0) {
      return severity;
    }

    const quantity = right.quantity - left.quantity;

    if (quantity !== 0) {
      return quantity;
    }

    return right.matchedDigits - left.matchedDigits;
  });
}

function sortPrizes(left: LotterySurvivalRawPrize, right: LotterySurvivalRawPrize): number {
  const typeOrder = getPrizeTypeOrder(left.type) - getPrizeTypeOrder(right.type);

  if (typeOrder !== 0) {
    return typeOrder;
  }

  return (left.position ?? 0) - (right.position ?? 0);
}

function getPrizeTypeOrder(type: string): number {
  const order: Record<string, number> = {
    FIRST: 1,
    NEAR_FIRST: 2,
    PRIZE2: 3,
    PRIZE3: 4,
    PRIZE4: 5,
    PRIZE5: 6,
    THREE_DIGIT: 7,
    THREE_FRONT: 8,
    THREE_BACK: 9,
    TWO_DIGIT: 10
  };

  return order[type] ?? 99;
}
