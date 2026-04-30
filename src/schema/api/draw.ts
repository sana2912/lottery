export type ApiDrawStatus = "complete" | "partial" | "imported";
export type ApiDrawSourceStatus = "IMPORTED" | "PARTIAL" | "VERIFIED";

export interface ApiDrawPrize {
  id: string;
  label: string;
  number: string;
  position?: number;
  type: string;
}

export interface ApiDraw {
  id: string;
  drawDate: string;
  drawDateIso: string;
  drawNo: string;
  lotteryType: string;
  metadata?: Record<string, unknown>;
  publishedAt?: string;
  status: ApiDrawStatus;
  statusLabel: string;
  sourceStatus: ApiDrawSourceStatus;
  sourceUrl?: string;
  coverage: string;
  prizes: ApiDrawPrize[];
}

export interface ApiDrawListPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiDrawListFilters {
  endDate?: string;
  lotteryType: string;
  month?: number;
  prizeType?: string;
  q?: string;
  startDate?: string;
  year?: number;
}

export interface ApiDrawListResponse {
  draws: ApiDraw[];
  filters: ApiDrawListFilters;
  generatedAt: string;
  pagination: ApiDrawListPagination;
  source: "api";
}

export interface ApiDrawDetailResponse {
  draw: ApiDraw;
  generatedAt: string;
  source: "api";
}
