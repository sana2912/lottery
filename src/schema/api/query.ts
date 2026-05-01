export type ApiLotteryType = "THAI_GOVERNMENT";

export type ApiLotteryPrizeType =
  | "FIRST"
  | "THREE_DIGIT"
  | "THREE_FRONT"
  | "THREE_BACK"
  | "TWO_DIGIT"
  | "NEAR_FIRST"
  | "PRIZE2"
  | "PRIZE3"
  | "PRIZE4"
  | "PRIZE5"
  | "OTHER";

export type ApiNumberLength = 2 | 3 | 6;

export interface ApiLotteryQuery {
  lotteryType?: ApiLotteryType;
  prizeType?: ApiLotteryPrizeType;
}

export interface ApiDrawRangeQuery extends ApiLotteryQuery {
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
}

export interface ApiPaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface ApiWindowQuery extends ApiLotteryQuery {
  windowSize?: number;
  numberLength?: ApiNumberLength;
}

export interface ApiSearchQuery extends ApiDrawRangeQuery, ApiPaginationQuery {
  q?: string;
}

export interface ApiFilterContext extends ApiDrawRangeQuery, ApiPaginationQuery, ApiWindowQuery {
  q?: string;
}
