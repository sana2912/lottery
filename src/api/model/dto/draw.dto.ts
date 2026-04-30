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
  metadata?: unknown;
  publishedAt?: Date | null | string;
  prizes?: readonly PrizeDtoInput[];
  sourceStatus?: null | string;
  sourceUrl?: null | string;
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
  const sourceStatus = getSourceStatus(draw.sourceStatus, prizes.length);
  const status = getDrawStatus(sourceStatus, prizes.length);
  const metadata = getMetadata(draw.metadata);

  return {
    id: draw.id,
    coverage: `${prizes.length} prize record${prizes.length === 1 ? "" : "s"}`,
    drawDate: formatDrawDate(draw.drawDate),
    drawDateIso,
    drawNo: draw.drawNo ?? "",
    lotteryType: draw.lotteryType,
    metadata,
    publishedAt: draw.publishedAt ? normalizeDateString(draw.publishedAt) : undefined,
    prizes,
    status,
    statusLabel: getStatusLabel(status),
    sourceStatus,
    sourceUrl: draw.sourceUrl ?? undefined
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

function getSourceStatus(sourceStatus: null | string | undefined, prizeCount: number) {
  if (sourceStatus === "IMPORTED" || sourceStatus === "PARTIAL" || sourceStatus === "VERIFIED") {
    return sourceStatus;
  }

  return prizeCount > 0 ? "VERIFIED" : "PARTIAL";
}

function getDrawStatus(
  sourceStatus: ReturnType<typeof getSourceStatus>,
  prizeCount: number
): ApiDraw["status"] {
  if (prizeCount === 0 || sourceStatus === "PARTIAL") {
    return "partial";
  }

  if (sourceStatus === "IMPORTED") {
    return "imported";
  }

  return "complete";
}

function getStatusLabel(status: ApiDraw["status"]) {
  const labels = {
    complete: "Complete",
    imported: "Imported",
    partial: "Partial"
  };

  return labels[status];
}

function getMetadata(metadata: unknown): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  return metadata as Record<string, unknown>;
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
    PRIZE2: "Prize 2",
    PRIZE3: "Prize 3",
    PRIZE4: "Prize 4",
    PRIZE5: "Prize 5",
    THREE_DIGIT: "Three-digit",
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
    PRIZE2: 3,
    PRIZE3: 4,
    PRIZE4: 5,
    PRIZE5: 6,
    THREE_DIGIT: 7,
    THREE_FRONT: 8,
    THREE_BACK: 9,
    TWO_DIGIT: 10,
    OTHER: 99
  };

  return order[type] ?? order.OTHER;
}
