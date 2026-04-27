import type { ApiWatchlistItem } from "@/schema/api/watchlist";

type WatchlistItemDtoInput = {
  id: string;
  number: string;
  tags: readonly string[];
};

export function toApiWatchlistItem(item: WatchlistItemDtoInput): ApiWatchlistItem {
  return {
    id: item.id,
    number: item.number,
    tags: [...item.tags]
  };
}
