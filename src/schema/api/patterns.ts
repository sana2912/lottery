import type { ApiPatternFlag } from "@/schema/api/analytics";

export interface ApiAnalysisPatternOverview {
  examples: string[];
  hitCount: number;
  id: string;
  label: string;
  pattern?: ApiPatternFlag;
  percent: number;
  sampleSize: number;
}

export interface ApiAnalysisPatternExample {
  dna: string;
  flags: ApiPatternFlag[];
  number: string;
  prizeType: string;
}

export interface ApiAnalysisPatternDistributionItem {
  id: string;
  label: string;
  value: string;
}

export interface ApiAnalysisPatternReadModel {
  distribution: ApiAnalysisPatternDistributionItem[];
  examples: ApiAnalysisPatternExample[];
  overview: ApiAnalysisPatternOverview[];
  sampleSize: number;
}

export interface ApiPatternsReadModel {
  context: {
    lotteryType: "THAI_GOVERNMENT";
    month?: number;
    numberLength: 2 | 3 | 6;
    prizeType: string;
    scope: "ALL_TIME" | "MONTH";
    windowPreset: "ALL";
    year?: number;
    windowSize: number;
  };
  generatedAt: string;
  pattern: ApiAnalysisPatternReadModel;
  source: "missing" | "on-demand" | "snapshot";
  summary: {
    drawCount: number;
    generatedAt: string;
  };
}
