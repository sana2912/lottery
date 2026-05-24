import type { ApiLotteryType } from "@/schema/api/query";

export type ApiTimeMachineSegment = "full6" | "front3" | "back3" | "last2";
export type ApiTimeMachineTimelineKind = "pass" | "hit" | "nearMiss";

export interface ApiTimeMachineSimulationRequest {
  lotteryType?: ApiLotteryType;
  startYear?: number;
  tickets: string[];
}

export interface ApiTimeMachineTicketShape {
  number: string;
}

export interface ApiTimeMachineDrawPrize {
  label: string;
  number: string;
  position?: number;
  type: string;
}

export interface ApiTimeMachineHitEvent {
  matchedDigits: number;
  points: number;
  prizeNumber: string;
  prizeType: string;
  segment: ApiTimeMachineSegment;
  ticket: string;
}

export interface ApiTimeMachineNearMissEvent {
  cinematicCopy: string;
  digitDistance: number;
  matchedDigits: number;
  matchedPositions: number[];
  points: number;
  prizeNumber: string;
  prizeType: "FIRST";
  ticket: string;
}

export interface ApiTimeMachineTimelineEvent {
  drawDateIso: string;
  drawDateLabel: string;
  drawId: string;
  drawPrizes: ApiTimeMachineDrawPrize[];
  hits?: ApiTimeMachineHitEvent[];
  kind: ApiTimeMachineTimelineKind;
  nearMiss?: ApiTimeMachineNearMissEvent;
  runningScore: number;
  scoreDelta: number;
  year: number;
}

export interface ApiTimeMachineHitCounts {
  first: number;
  nearFirst: number;
  otherSixDigit: number;
  threeDigit: number;
  twoDigit: number;
  total: number;
}

export interface ApiTimeMachineChartPoint {
  id: string;
  label: string;
  value: number;
}

export interface ApiTimeMachineSummary {
  bestNearMiss?: ApiTimeMachineNearMissEvent;
  chartScoreByYear: ApiTimeMachineChartPoint[];
  closestFirstMoment?: ApiTimeMachineNearMissEvent;
  hitCounts: ApiTimeMachineHitCounts;
  longestQuietStreak: number;
  totalScore: number;
}

export interface ApiTimeMachineSimulationMeta {
  drawCount: number;
  endDateIso: string;
  generatedAt: string;
  lotteryType: ApiLotteryType;
  startDateIso: string;
  ticketCount: number;
}

export interface ApiTimeMachineSimulationResponse {
  meta: ApiTimeMachineSimulationMeta;
  summary: ApiTimeMachineSummary;
  tickets: ApiTimeMachineTicketShape[];
  timeline: ApiTimeMachineTimelineEvent[];
}
