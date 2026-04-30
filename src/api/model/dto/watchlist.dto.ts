import type {
  ApiWatchlistItem,
  ApiWatchlistReadModel,
  ApiWatchlistSource,
  ApiWatchlistStatSummary
} from "@/schema/api/watchlist";

type WatchlistItemDtoInput = {
  createdAt: Date | string;
  id: string;
  note?: null | string;
  number: string;
  source: ApiWatchlistSource;
  stats?: ApiWatchlistStatSummary;
  tags: readonly string[];
  updatedAt: Date | string;
};

export function toApiWatchlistItem(item: WatchlistItemDtoInput): ApiWatchlistItem {
  return {
    createdAt: normalizeDateString(item.createdAt),
    id: item.id,
    note: item.note ?? undefined,
    number: item.number,
    scope: "global",
    source: item.source,
    stats: item.stats,
    tags: [...item.tags],
    updatedAt: normalizeDateString(item.updatedAt)
  };
}

export function toApiWatchlistReadModel(
  items: readonly WatchlistItemDtoInput[]
): ApiWatchlistReadModel {
  return {
    generatedAt: new Date().toISOString(),
    items: items.map(toApiWatchlistItem),
    scope: "global",
    source: "api"
  };
}

function normalizeDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
