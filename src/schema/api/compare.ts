export interface ApiScoreBreakdown {
  hot: number;
  overdue: number;
  position: number;
  pair: number;
  pattern: number;
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
  candidates: ApiCompareCandidate[];
  strongestSignal?: string;
  sampleSize: number;
}
