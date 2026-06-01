import { getPatternDefinitionsForPrizeType } from "@/lib/app/pattern-playground";
import type {
  LotterySurvivalNearMiss,
  LotterySurvivalRoundRequest,
  LotterySurvivalRoundResponse,
  LotterySurvivalStrategy
} from "@/schema/app/lottery-survival.schema";

export const LOTTERY_SURVIVAL_STARTING_BALANCE = 800_000;
export const LOTTERY_SURVIVAL_TICKET_PRICE = 80;
export const DEFAULT_FAVORITE_DIGITS = ["2", "7"] as const;

export type LotterySurvivalManualParseResult = {
  invalidTickets: string[];
  tickets: string[];
};

export type LotterySurvivalSummary = {
  bestRound?: LotterySurvivalRoundResponse;
  closestNearMiss?: LotterySurvivalNearMiss;
  finalBalance: number;
  maxPrizeSingleRound: number;
  narratorMessage: string;
  roundsSurvived: number;
  startingBalance: number;
  totalPrize: number;
  totalTickets: number;
  worstRound?: LotterySurvivalRoundResponse;
};

export const lotterySurvivalStrategyOptions: Array<{
  label: string;
  value: LotterySurvivalStrategy;
}> = [
  { label: "Random ทั้งหมด", value: "random" },
  { label: "Random ตาม pattern", value: "pattern" },
  { label: "ถ่วงน้ำหนักเลขที่ชอบ", value: "favorite" },
  { label: "Pattern + เลขที่ชอบ", value: "patternFavorite" }
];

export function getLotterySurvivalPatternOptions() {
  return getPatternDefinitionsForPrizeType("SIX_DIGIT_ALL").map((definition) => ({
    id: definition.id,
    label: definition.label
  }));
}

export function getAffordableTicketCount(balance: number): number {
  return Math.floor(balance / LOTTERY_SURVIVAL_TICKET_PRICE);
}

export function canUseManualTickets(balance: number): boolean {
  const count = getAffordableTicketCount(balance);

  return count > 0 && count <= 20;
}

export function parseManualTickets(value: string): LotterySurvivalManualParseResult {
  const rawTickets = value
    .split(/[\s,]+/)
    .map((ticket) => ticket.trim())
    .filter(Boolean);
  const tickets: string[] = [];
  const invalidTickets: string[] = [];

  for (const ticket of rawTickets) {
    if (/^\d{6}$/.test(ticket)) {
      tickets.push(ticket);
    } else {
      invalidTickets.push(ticket);
    }
  }

  return { invalidTickets, tickets };
}

export function normalizeManualTicketDraft(value: string): string {
  return value.replace(/[^\d,\s]/g, "");
}

export function buildLotterySurvivalPayload(input: {
  balance: number;
  favoriteDigits: readonly string[];
  manualTicketDraft: string;
  patternId: string;
  roundIndex: number;
  strategy: LotterySurvivalStrategy;
}): LotterySurvivalRoundRequest {
  const manualParse = parseManualTickets(input.manualTicketDraft);
  const manualTickets =
    canUseManualTickets(input.balance) && manualParse.tickets.length > 0
      ? manualParse.tickets
      : undefined;

  return {
    balanceBefore: input.balance,
    ...(input.strategy === "favorite" || input.strategy === "patternFavorite"
      ? { favoriteDigits: [...input.favoriteDigits] }
      : {}),
    ...(manualTickets ? { manualTickets } : {}),
    ...(input.strategy === "pattern" || input.strategy === "patternFavorite"
      ? { patternId: input.patternId }
      : {}),
    roundIndex: input.roundIndex,
    strategy: input.strategy
  };
}

export function buildLotterySurvivalSummary(input: {
  finalBalance: number;
  history: readonly LotterySurvivalRoundResponse[];
}): LotterySurvivalSummary {
  const totalPrize = input.history.reduce((sum, round) => sum + round.prizeTotal, 0);
  const totalTickets = input.history.reduce((sum, round) => sum + round.ticketCount, 0);
  const bestRound = pickBestRound(input.history);
  const worstRound = pickWorstRound(input.history);
  const closestNearMiss = pickClosestNearMiss(input.history);

  return {
    bestRound,
    closestNearMiss,
    finalBalance: input.finalBalance,
    maxPrizeSingleRound: bestRound?.prizeTotal ?? 0,
    narratorMessage: getSummaryNarratorMessage({
      finalBalance: input.finalBalance,
      roundsSurvived: input.history.length,
      startingBalance: LOTTERY_SURVIVAL_STARTING_BALANCE
    }),
    roundsSurvived: input.history.length,
    startingBalance: LOTTERY_SURVIVAL_STARTING_BALANCE,
    totalPrize,
    totalTickets,
    worstRound
  };
}

export function formatLotterySurvivalCurrency(value: number): string {
  return value.toLocaleString("th-TH", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
}

export function formatLotterySurvivalSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : "";

  return `${sign}${formatLotterySurvivalCurrency(value)}`;
}

export function getRoundNet(round: LotterySurvivalRoundResponse): number {
  return round.prizeTotal - round.purchaseCost;
}

export function getStrategyLabel(strategy: LotterySurvivalStrategy): string {
  return (
    lotterySurvivalStrategyOptions.find((option) => option.value === strategy)?.label ??
    "Random ทั้งหมด"
  );
}

export function pickBestRound(
  history: readonly LotterySurvivalRoundResponse[]
): LotterySurvivalRoundResponse | undefined {
  return [...history].sort((left, right) => right.prizeTotal - left.prizeTotal)[0];
}

export function pickWorstRound(
  history: readonly LotterySurvivalRoundResponse[]
): LotterySurvivalRoundResponse | undefined {
  return [...history].sort((left, right) => getRoundNet(left) - getRoundNet(right))[0];
}

export function pickClosestNearMiss(
  history: readonly LotterySurvivalRoundResponse[]
): LotterySurvivalNearMiss | undefined {
  return history
    .flatMap((round) => round.nearMisses)
    .sort((left, right) => {
      const severity = right.severity - left.severity;

      if (severity !== 0) {
        return severity;
      }

      return right.matchedDigits - left.matchedDigits;
    })[0];
}

function getSummaryNarratorMessage(input: {
  finalBalance: number;
  roundsSurvived: number;
  startingBalance: number;
}): string {
  if (input.roundsSurvived === 0) {
    return "ท่านยังไม่ได้ส่งเงินเข้าไปในระบบ ถือว่าปลอดภัยที่สุดในเชิงการเงิน";
  }

  if (input.roundsSurvived <= 2) {
    return "มือของท่านไม่มีโชคเลย สองงวดก็จอดแล้ว";
  }

  if (input.finalBalance > input.startingBalance) {
    return "ท่านเดินออกจากระบบหวยด้วยเงินมากกว่าตอนเข้า ระบบขอปรบมือแบบระมัดระวัง";
  }

  if (input.finalBalance < LOTTERY_SURVIVAL_TICKET_PRICE) {
    return "เงิน 800,000 บาทพาท่านมาถึงจุดที่ซื้อต่อไม่ได้แล้ว";
  }

  return "บางทีการหยุดเองก็เป็นรางวัลที่แท้จริง";
}
