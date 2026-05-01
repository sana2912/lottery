import type { ApiWatchlistPrizeType, ApiWatchlistSource } from "@/schema/api/watchlist";

export interface ApiSearchDrawHit {
  drawDate: string;
  drawNo: string;
  id: string;
  sourceStatus: "IMPORTED" | "PARTIAL" | "VERIFIED";
}

export interface ApiSearchPrizeHit {
  drawDate: string;
  drawId: string;
  drawNo: string;
  id: string;
  number: string;
  prizeType: ApiWatchlistPrizeType;
}

export interface ApiSearchStatHit {
  frequencyPercent: number;
  hitCount: number;
  lastSeenDrawDate?: string;
  missingDrawCount: number;
  number: string;
  prizeType: ApiWatchlistPrizeType;
  trendScore: number;
  windowSize: number;
}

export interface ApiSearchWatchlistHit {
  id: string;
  note?: string;
  number: string;
  source: ApiWatchlistSource;
  tags: string[];
  updatedAt: string;
}

export interface ApiSearchReadModel {
  generatedAt: string;
  groups: {
    draws: ApiSearchDrawHit[];
    prizes: ApiSearchPrizeHit[];
    stats: ApiSearchStatHit[];
    watchlist: ApiSearchWatchlistHit[];
  };
  q: string;
  source: "api";
}
