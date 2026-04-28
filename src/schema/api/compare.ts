import type { ApiPredictionScoreBreakdown, ApiPredictionStrategyId } from "@/schema/api/prediction";

export type ApiScoreBreakdown = ApiPredictionScoreBreakdown;

export interface ApiCompareCandidate {
  number: string;
  numberLength: number;
  score: number;
  rank: number;
  scoreBreakdown: ApiScoreBreakdown;
  reasons: string[];
}

export interface ApiCompareReadModel {
  generatedAt: string;
  source: "mock" | "api";
  strategyId?: ApiPredictionStrategyId;
  candidates: ApiCompareCandidate[];
  strongestSignal?: string;
  sampleSize: number;
}
