import type { ApiWatchlistSource } from "@/schema/api/watchlist";

export type ApiSearchPrizeHitPrizeType =
  | "FIRST"
  | "NEAR_FIRST"
  | "THREE_DIGIT"
  | "THREE_FRONT"
  | "THREE_BACK"
  | "TWO_DIGIT"
  | "PRIZE2"
  | "PRIZE3"
  | "PRIZE4"
  | "PRIZE5";

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
  prizeType: ApiSearchPrizeHitPrizeType;
}

export interface ApiSearchStatHit {
  frequencyPercent: number;
  hitCount: number;
  lastSeenDrawDate?: string;
  missingDrawCount: number;
  number: string;
  prizeType: import("@/schema/api/watchlist").ApiWatchlistPrizeType; // analysis-facing stat context
  samplePrizeCount?: number;
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
