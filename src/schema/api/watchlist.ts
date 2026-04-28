export type ApiWatchlistScope = "global";
export type ApiWatchlistSource = "MANUAL" | "NOTEBOOK" | "PREDICTION";

export interface ApiWatchlistItem {
  id: string;
  createdAt: string;
  note?: string;
  number: string;
  scope: ApiWatchlistScope;
  source: ApiWatchlistSource;
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
