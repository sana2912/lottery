export type ApiWatchlistScope = "global";
export type ApiWatchlistSource = "MANUAL" | "NOTEBOOK" | "PREDICTION";
export type ApiWatchlistPrizeType =
  | "FIRST"
  | "NEAR_FIRST"
  | "SIX_DIGIT_ALL"
  | "THREE_DIGIT"
  | "THREE_FRONT"
  | "THREE_BACK"
  | "TWO_DIGIT"
  | "PRIZE2"
  | "PRIZE3"
  | "PRIZE4"
  | "PRIZE5";

export interface ApiWatchlistStatSummary {
  frequencyPercent: number;
  hitCount: number;
  lastSeenDrawDate?: string;
  missingDrawCount: number;
  prizeType: ApiWatchlistPrizeType;
  samplePrizeCount?: number;
}

export interface ApiWatchlistItem {
  id: string;
  createdAt: string;
  note?: string;
  number: string;
  scope: ApiWatchlistScope;
  source: ApiWatchlistSource;
  stats?: ApiWatchlistStatSummary;
  tags: string[];
  updatedAt: string;
}

export interface ApiWatchlistReadModel {
  generatedAt: string;
  items: ApiWatchlistItem[];
  scope: ApiWatchlistScope;
  source: "api";
}

export interface ApiCreateWatchlistItemRequest {
  note?: string;
  number: string;
  source?: ApiWatchlistSource;
  tags?: string[];
}

export interface ApiUpdateWatchlistItemRequest {
  note?: string;
  source?: ApiWatchlistSource;
  tags?: string[];
}

export interface ApiDeleteWatchlistItemResponse {
  deleted: true;
  id: string;
  scope: ApiWatchlistScope;
}
