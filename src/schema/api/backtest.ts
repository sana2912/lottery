import type { ApiPredictionStrategyId } from "@/schema/api/prediction";
import type { ApiFilterContext, ApiNumberLength } from "@/schema/api/query";

export interface ApiBacktestRequest extends ApiFilterContext {
  candidateCount?: number;
  numberLength?: ApiNumberLength;
  params?: Record<string, unknown>;
  strategyId?: ApiPredictionStrategyId;
}

export interface ApiBacktestRun {
  id: string;
  strategyId: string;
  strategyName: string;
  params: Record<string, unknown>;
  lotteryType: string;
  prizeType: string;
  numberLength: number;
  startDrawDate: string;
  endDrawDate: string;
  candidateCount: number;
  hitRate: number;
  longestMissStreak: number;
  averageHitRank?: number;
  coverage: number;
  computedAt: string;
  version: string;
}

export interface ApiBacktestResult {
  id: string;
  runId: string;
  drawId: string;
  drawDate: string;
  generatedNumbers: string[];
  actualNumbers: string[];
  isHit: boolean;
  hitNumbers: string[];
  rankOfHit?: number;
}

export interface ApiBacktestReadModel {
  generatedAt: string;
  source: "mock" | "api";
  run: ApiBacktestRun;
  results: ApiBacktestResult[];
}

export interface ApiBacktestHistoryItem {
  id: string;
  strategyId: string;
  strategyName: string;
  lotteryType: string;
  prizeType: string;
  numberLength: number;
  candidateCount: number;
  hitRate: number;
  longestMissStreak: number;
  coverage: number;
  computedAt: string;
  version: string;
}

export interface ApiBacktestHistoryResponse {
  generatedAt: string;
  source: "api";
  items: ApiBacktestHistoryItem[];
}
