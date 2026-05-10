export interface ApiAnalyticsSummary {
  drawCount: number;
  generatedAt: string;
}

export type ApiTrendDirection = "up" | "down" | "flat";

export type ApiPatternFlag =
  | "odd"
  | "even"
  | "high"
  | "low"
  | "double"
  | "has_repeat"
  | "all_unique"
  | "double_pair"
  | "triple"
  | "quad_or_more"
  | "ascending"
  | "descending"
  | "ascending_run"
  | "descending_run"
  | "mirror"
  | "palindrome"
  | "balanced_odd_even"
  | "balanced_high_low"
  | "low_sum"
  | "mid_sum"
  | "high_sum";

export interface ApiDigitStat {
  lotteryType: string;
  prizeType: string;
  digit: string;
  position?: number;
  windowSize: number;
  drawCount: number;
  hitCount: number;
  frequencyPercent: number;
  lastSeenDrawDate?: string;
  missingDrawCount: number;
  trendDirection: ApiTrendDirection;
  computedAt: string;
}

export interface ApiNumberStat {
  number: string;
  numberLength: number;
  lotteryType: string;
  prizeType: string;
  windowSize: number;
  drawCount: number;
  hitCount: number;
  frequencyPercent: number;
  lastSeenDrawDate?: string;
  missingDrawCount: number;
  averageGap?: number;
  maxGap?: number;
  trendScore: number;
  patternFlags: ApiPatternFlag[];
  computedAt: string;
}

export interface ApiPatternSummary {
  id: string;
  label: string;
  pattern: ApiPatternFlag;
  hitCount: number;
  frequencyPercent: number;
  sampleSize: number;
  insight: string;
}

export interface ApiAnalyticsReadModel {
  generatedAt: string;
  source: "mock" | "api";
  summary: ApiAnalyticsSummary;
  digitStats: ApiDigitStat[];
  numberStats: ApiNumberStat[];
  patternSummaries: ApiPatternSummary[];
}
