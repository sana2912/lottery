import type { ApiLotteryPrizeType, ApiLotteryType } from "@/schema/api/query";
import type { ApiTimeMachineSegment } from "@/schema/api/time-machine";

export type ApiLotterySurvivalStrategy = "favorite" | "pattern" | "patternFavorite" | "random";

export type ApiLotterySurvivalTicketSource = "generated" | "manual";

export type ApiLotterySurvivalNearMissCategory =
  | "FIRST_LAST_FIVE"
  | "FIRST_ONE_DIGIT"
  | "FRONT_OR_BACK_THREE"
  | "LAST_TWO"
  | "MULTIPLE_NEAR_MISSES";

export interface ApiLotterySurvivalRoundRequest {
  balanceBefore: number;
  favoriteDigits?: string[];
  manualTickets?: string[];
  patternId?: string;
  roundIndex: number;
  strategy: ApiLotterySurvivalStrategy;
}

export interface ApiLotterySurvivalPrize {
  label: string;
  number: string;
  position?: number;
  type: ApiLotteryPrizeType;
}

export interface ApiLotterySurvivalDraw {
  drawDateIso: string;
  drawDateLabel: string;
  drawNo?: string;
  id: string;
  prizes: ApiLotterySurvivalPrize[];
  sourceStatus: "IMPORTED" | "PARTIAL" | "VERIFIED";
}

export interface ApiLotterySurvivalTicketPreviewItem {
  id: string;
  number: string;
  source: ApiLotterySurvivalTicketSource;
}

export interface ApiLotterySurvivalTicketPreview {
  items: ApiLotterySurvivalTicketPreviewItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiLotterySurvivalHit {
  matchedDigits: number;
  prizeAmount: number;
  prizeLabel: string;
  prizeNumber: string;
  prizeType: ApiLotteryPrizeType;
  quantity: number;
  segment: ApiTimeMachineSegment;
  ticket: string;
  totalPrize: number;
}

export interface ApiLotterySurvivalPrizeBreakdownItem {
  groupedEntryCount: number;
  prizeLabel: string;
  prizeType: ApiLotteryPrizeType;
  rawMatchCount: number;
  subtotal: number;
}

export interface ApiLotterySurvivalWinBreakdown {
  byPrizeType: ApiLotterySurvivalPrizeBreakdownItem[];
  totalGroupedWinningEntries: number;
  totalPrizeMoney: number;
  totalRawWinningMatches: number;
}

export interface ApiLotterySurvivalNearMiss {
  category: ApiLotterySurvivalNearMissCategory;
  description: string;
  digitDistance: number;
  id: string;
  label: string;
  matchedDigits: number;
  matchedPositions: number[];
  prizeNumber: string;
  prizeType: ApiLotteryPrizeType;
  quantity: number;
  severity: number;
  ticket: string;
}

export interface ApiLotterySurvivalRoundResponse {
  balanceAfter: number;
  balanceBefore: number;
  carryOver: number;
  draw: ApiLotterySurvivalDraw;
  generatedCount: number;
  lotteryType: ApiLotteryType;
  manualCount: number;
  narratorMessage: string;
  nearMisses: ApiLotterySurvivalNearMiss[];
  prizeTotal: number;
  purchaseCost: number;
  roundIndex: number;
  ticketCount: number;
  ticketPreview: ApiLotterySurvivalTicketPreview;
  winBreakdown: ApiLotterySurvivalWinBreakdown;
  winningTickets: ApiLotterySurvivalHit[];
}
