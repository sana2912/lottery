export type ApiResultDrawStatus = "complete" | "partial" | "imported";

export interface ApiResultsHero {
  eyebrow: string;
  title: string;
  description: string;
  coverageLabel: string;
  coverageValue: string;
}

export interface ApiResultsStat {
  label: string;
  value: string;
  hint: string;
}

export interface ApiResultsFilters {
  lotteryTypes: string[];
  prizeTypes: string[];
  defaultLotteryType: string;
  defaultPrizeType: string;
}

export interface ApiResultsHighlight {
  title: string;
  description: string;
}

export interface ApiResultsPrize {
  label: string;
  value: string;
  prizeType: string;
}

export interface ApiResultsDraw {
  id: string;
  drawDate: string;
  drawDateIso: string;
  drawNo: string;
  lotteryType: string;
  status: ApiResultDrawStatus;
  statusLabel: string;
  coverage: string;
  prizes: ApiResultsPrize[];
}

export interface ApiResultsContractRow {
  field: string;
  source: string;
  purpose: string;
}

export interface ApiResultsReadModel {
  generatedAt: string;
  source: "mock" | "api";
  hero: ApiResultsHero;
  stats: ApiResultsStat[];
  filters: ApiResultsFilters;
  highlights: ApiResultsHighlight[];
  draws: ApiResultsDraw[];
  contractRows: ApiResultsContractRow[];
  mockNote: string;
}
