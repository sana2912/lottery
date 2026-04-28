export type ApiDrawStatus = "complete" | "partial" | "imported";

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
  status: ApiDrawStatus;
  statusLabel: string;
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
