import type { ApiLotteryPrizeType, ApiLotteryType, ApiNumberLength } from "@/schema/api/query";

export type ApiPredictionStrategyId = "balanced" | "coldRebound" | "hotTrend";

export interface ApiPredictionScoreBreakdown {
  hot: number;
  overdue: number;
  pair: number;
  pattern: number;
  position: number;
}

export interface ApiPredictionPositionBreakdown {
  digit: string;
  hot: number;
  overdue: number;
  position: number;
  positionIndex: number;
  reasons: string[];
  score: number;
  tone: "hot" | "warm" | "neutral" | "cold";
}

export interface ApiPredictionResult {
  id: string;
  inputWindow: number;
  number: string;
  numberLength: number;
  positionBreakdown: ApiPredictionPositionBreakdown[];
  rank: number;
  reasons: string[];
  score: number;
  scoreBreakdown: ApiPredictionScoreBreakdown;
  strategyId: ApiPredictionStrategyId;
  strategyName: string;
  version: string;
}

export interface ApiPredictionRequest {
  count?: number;
  lotteryType?: ApiLotteryType;
  numberLength?: ApiNumberLength;
  prizeType?: ApiLotteryPrizeType;
  strategyId?: ApiPredictionStrategyId;
  windowSize?: number;
}

export interface ApiPredictionResponse {
  generatedAt: string;
  input: Required<ApiPredictionRequest>;
  results: ApiPredictionResult[];
  source: "api";
}
