import type {
  ApiDraw,
  ApiDrawDetailResponse,
  ApiDrawListResponse,
  ApiDrawPrize
} from "@/schema/api/draw";

type DrawDtoInput = {
  drawNo?: null | string;
  id: string;
  drawDate: Date | string;
  lotteryType: string;
  prizes?: readonly PrizeDtoInput[];
};

type PrizeDtoInput = {
  id: string;
  number: string;
  position?: null | number;
  type: string;
};

type DrawListDtoInput = {
  draws: readonly DrawDtoInput[];
  filters: ApiDrawListResponse["filters"];
  generatedAt?: Date | string;
  pagination: ApiDrawListResponse["pagination"];
};

export function toApiDraw(draw: DrawDtoInput): ApiDraw {
  const prizes = [...(draw.prizes ?? [])].sort(sortPrizeInput).map(toApiDrawPrize);
  const drawDateIso = normalizeDateString(draw.drawDate);

  return {
    id: draw.id,
    coverage: `${prizes.length} prize record${prizes.length === 1 ? "" : "s"}`,
    drawDate: formatDrawDate(draw.drawDate),
    drawDateIso,
    drawNo: draw.drawNo ?? "",
    lotteryType: draw.lotteryType,
    prizes,
    status: prizes.length > 0 ? "complete" : "partial",
    statusLabel: prizes.length > 0 ? "Complete" : "Partial"
  };
}

export function toApiDrawListResponse(input: DrawListDtoInput): ApiDrawListResponse {
  return {
    draws: input.draws.map(toApiDraw),
    filters: input.filters,
    generatedAt: normalizeDateString(input.generatedAt ?? new Date()),
    pagination: input.pagination,
    source: "api"
  };
}

export function toApiDrawDetailResponse(draw: DrawDtoInput): ApiDrawDetailResponse {
  return {
    draw: toApiDraw(draw),
    generatedAt: new Date().toISOString(),
    source: "api"
  };
}

function toApiDrawPrize(prize: PrizeDtoInput): ApiDrawPrize {
  return {
    id: prize.id,
    label: getPrizeLabel(prize.type, prize.position),
    number: prize.number,
    position: prize.position ?? undefined,
    type: prize.type
  };
}

function normalizeDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function formatDrawDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long"
  }).format(date);
}

function getPrizeLabel(type: string, position?: null | number): string {
  const labels: Record<string, string> = {
    FIRST: "First prize",
    NEAR_FIRST: "Near first prize",
    OTHER: "Other prize",
    THREE_BACK: "Three-digit back",
    THREE_FRONT: "Three-digit front",
    TWO_DIGIT: "Two-digit"
  };

  const label = labels[type] ?? type;

  return position ? `${label} #${position}` : label;
}

function sortPrizeInput(left: PrizeDtoInput, right: PrizeDtoInput): number {
  const typeOrder = getPrizeTypeOrder(left.type) - getPrizeTypeOrder(right.type);

  if (typeOrder !== 0) {
    return typeOrder;
  }

  return (left.position ?? 0) - (right.position ?? 0);
}

function getPrizeTypeOrder(type: string): number {
  const order: Record<string, number> = {
    FIRST: 1,
    NEAR_FIRST: 2,
    THREE_FRONT: 3,
    THREE_BACK: 4,
    TWO_DIGIT: 5,
    OTHER: 99
  };

  return order[type] ?? order.OTHER;
}
