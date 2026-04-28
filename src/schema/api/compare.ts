import type { ApiPredictionScoreBreakdown, ApiPredictionStrategyId } from "@/schema/api/prediction";
import type { ApiFilterContext, ApiNumberLength } from "@/schema/api/query";

export type ApiScoreBreakdown = ApiPredictionScoreBreakdown;

export interface ApiCompareRequest extends ApiFilterContext {
  numbers: string[];
  numberLength?: ApiNumberLength;
  strategyId?: ApiPredictionStrategyId;
}

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
