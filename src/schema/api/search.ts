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

export type ApiSearchStatHitPrizeType = ApiSearchPrizeHitPrizeType | "SIX_DIGIT_ALL";

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
  drawCount: number;
  frequencyPercent: number;
  hitCount: number;
  lastSeenDrawDate?: string;
  missingDrawCount: number;
  number: string;
  prizeType: ApiSearchStatHitPrizeType;
  samplePrizeCount?: number;
  trendScore: number;
}

export interface ApiSearchReadModel {
  generatedAt: string;
  groups: {
    draws: ApiSearchDrawHit[];
    prizes: ApiSearchPrizeHit[];
    stats: ApiSearchStatHit[];
  };
  q: string;
  source: "api";
}
