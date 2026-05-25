export type ApiDashboardMetricTone =
  | "default"
  | "hot"
  | "cold"
  | "overdue"
  | "prediction"
  | "backtest";

export interface ApiDashboardHero {
  eyebrow: string;
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionHref: string;
}

export interface ApiDashboardMetric {
  label: string;
  value: string;
  hint: string;
  tone: ApiDashboardMetricTone;
  trend?: string;
}

export interface ApiDashboardLatestDrawPrize {
  label: string;
  value: string;
}

export interface ApiDashboardLatestDraw {
  id: string;
  drawDate: string;
  drawDateIso: string;
  drawNo: string;
  lotteryType: string;
  statusLabel: string;
  primaryPrize: ApiDashboardLatestDrawPrize;
  secondaryPrizes: ApiDashboardLatestDrawPrize[];
}

export interface ApiDashboardSignal {
  id: string;
  label: string;
  number: string;
  score: number;
  tone: ApiDashboardMetricTone;
  reason: string;
}

export interface ApiDashboardPredictionCandidate {
  number: string;
  score: number;
  reasons: string[];
}

export interface ApiDashboardPredictionSummary {
  title: string;
  generatedAt: string;
  candidates: ApiDashboardPredictionCandidate[];
  disclaimer: string;
}

export interface ApiDashboardContractRow {
  field: string;
  source: string;
  purpose: string;
}

export interface ApiDashboardReadModel {
  generatedAt: string;
  source: "mock" | "api";
  hero: ApiDashboardHero;
  metrics: ApiDashboardMetric[];
  latestDraw: ApiDashboardLatestDraw;
  signals: ApiDashboardSignal[];
  predictionSummary: ApiDashboardPredictionSummary;
  contractRows: ApiDashboardContractRow[];
}
