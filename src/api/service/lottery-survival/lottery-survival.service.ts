import {
  LOTTERY_SURVIVAL_PREVIEW_PAGE_SIZE,
  LOTTERY_SURVIVAL_TICKET_PRICE
} from "@/api/service/lottery-survival/constants";
import { getLotterySurvivalNarratorMessage } from "@/api/service/lottery-survival/copy";
import {
  buildLotterySurvivalTickets,
  type LotterySurvivalRng,
  LotterySurvivalTicketGenerationError
} from "@/api/service/lottery-survival/generator";
import {
  isLotterySurvivalEligibleDraw,
  type LotterySurvivalDrawRecord,
  type LotterySurvivalRawPrize,
  scoreLotterySurvivalRound,
  toLotterySurvivalPrizes
} from "@/api/service/lottery-survival/scoring";
import { getPrisma } from "@/api/service/prisma";
import type {
  LotterySurvivalRoundRequest,
  LotterySurvivalRoundResponse
} from "@/schema/app/lottery-survival.schema";

export class LotterySurvivalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LotterySurvivalValidationError";
  }
}

export async function runLotterySurvivalRound(
  input: LotterySurvivalRoundRequest
): Promise<LotterySurvivalRoundResponse> {
  const prisma = getPrisma();
  const draws = await prisma.lotteryDraw.findMany({
    orderBy: {
      drawDate: "asc"
    },
    select: {
      drawDate: true,
      drawNo: true,
      id: true,
      prizes: {
        select: {
          number: true,
          position: true,
          type: true
        }
      },
      sourceStatus: true
    },
    where: {
      lotteryType: "THAI_GOVERNMENT",
      prizes: {
        some: {
          type: "FIRST"
        }
      }
    }
  });

  return runLotterySurvivalRoundFromDraws({
    draws: draws.map(toDrawRecord),
    input
  });
}

export function runLotterySurvivalRoundFromDraws(input: {
  draws: readonly LotterySurvivalDrawRecord[];
  input: LotterySurvivalRoundRequest;
  rng?: LotterySurvivalRng;
}): LotterySurvivalRoundResponse {
  const ticketCount = Math.floor(input.input.balanceBefore / LOTTERY_SURVIVAL_TICKET_PRICE);

  if (ticketCount < 1) {
    throw new LotterySurvivalValidationError("Balance is not enough to buy a ticket.");
  }

  if ((input.input.manualTickets?.length ?? 0) > 0 && ticketCount > 20) {
    throw new LotterySurvivalValidationError(
      "Manual tickets are allowed only when the round buys 20 tickets or fewer."
    );
  }

  if ((input.input.manualTickets?.length ?? 0) > ticketCount) {
    throw new LotterySurvivalValidationError("Manual tickets exceed the affordable count.");
  }

  const draw = pickLotterySurvivalDraw(input.draws, input.rng);
  const tickets = buildLotterySurvivalTickets({
    favoriteDigits: input.input.favoriteDigits,
    manualTickets: input.input.manualTickets,
    patternId: input.input.patternId,
    rng: input.rng,
    strategy: input.input.strategy,
    ticketCount
  });
  const purchaseCost = ticketCount * LOTTERY_SURVIVAL_TICKET_PRICE;
  const carryOver = input.input.balanceBefore - purchaseCost;
  const score = scoreLotterySurvivalRound({ draw, tickets });
  const balanceAfter = carryOver + score.prizeTotal;
  const manualCount = tickets.filter((ticket) => ticket.source === "manual").length;
  const generatedCount = tickets.length - manualCount;

  return {
    balanceAfter,
    balanceBefore: input.input.balanceBefore,
    carryOver,
    draw: {
      drawDateIso: normalizeDateIso(draw.drawDate),
      drawDateLabel: formatDateLabel(draw.drawDate),
      drawNo: draw.drawNo ?? undefined,
      id: draw.id,
      prizes: toLotterySurvivalPrizes(draw.prizes),
      sourceStatus: draw.sourceStatus
    },
    generatedCount,
    lotteryType: "THAI_GOVERNMENT",
    manualCount,
    narratorMessage: getLotterySurvivalNarratorMessage({
      balanceAfter,
      prizeTotal: score.prizeTotal,
      roundIndex: input.input.roundIndex,
      ticketPrice: LOTTERY_SURVIVAL_TICKET_PRICE,
      topNearMiss: score.nearMisses[0]
    }),
    nearMisses: score.nearMisses,
    prizeTotal: score.prizeTotal,
    purchaseCost,
    roundIndex: input.input.roundIndex,
    ticketCount,
    ticketPreview: {
      items: tickets.slice(0, LOTTERY_SURVIVAL_PREVIEW_PAGE_SIZE),
      page: 1,
      pageSize: LOTTERY_SURVIVAL_PREVIEW_PAGE_SIZE,
      total: tickets.length
    },
    winBreakdown: score.winBreakdown,
    winningTickets: score.winningTickets
  };
}

export const lotterySurvivalService = {
  runLotterySurvivalRound
} as const;

export function pickLotterySurvivalDraw(
  draws: readonly LotterySurvivalDrawRecord[],
  rng: LotterySurvivalRng = Math.random
): LotterySurvivalDrawRecord {
  const eligibleDraws = draws.filter(isLotterySurvivalEligibleDraw);

  if (eligibleDraws.length === 0) {
    throw new LotterySurvivalValidationError("No eligible historical lottery draws were found.");
  }

  return eligibleDraws[Math.floor(rng() * eligibleDraws.length)] ?? eligibleDraws[0];
}

function toDrawRecord(draw: {
  drawDate: Date;
  drawNo: null | string;
  id: string;
  prizes: readonly LotterySurvivalRawPrize[];
  sourceStatus: "IMPORTED" | "PARTIAL" | "VERIFIED";
}): LotterySurvivalDrawRecord {
  return {
    drawDate: draw.drawDate,
    drawNo: draw.drawNo,
    id: draw.id,
    prizes: draw.prizes,
    sourceStatus: draw.sourceStatus
  };
}

function formatDateLabel(value: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long"
  }).format(new Date(value));
}

function normalizeDateIso(value: Date | string): string {
  return new Date(value).toISOString();
}

export function toLotterySurvivalServiceError(error: unknown): Error {
  if (
    error instanceof LotterySurvivalValidationError ||
    error instanceof LotterySurvivalTicketGenerationError
  ) {
    return error;
  }

  return error instanceof Error ? error : new Error(String(error));
}
