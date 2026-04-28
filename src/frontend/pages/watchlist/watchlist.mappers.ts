import type { WatchlistSource } from "@/schema/app/watchlist.schema";

export type WatchlistFormState = {
  note: string;
  number: string;
  tags: string;
};

export type WatchlistEditState = {
  note: string;
  source: WatchlistSource;
  tags: string;
};

export const defaultWatchlistFormState: WatchlistFormState = {
  note: "",
  number: "",
  tags: ""
};

export function parseWatchlistTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function toCreateWatchlistPayload(formState: WatchlistFormState) {
  return {
    note: formState.note || undefined,
    number: formState.number,
    source: "MANUAL" as const,
    tags: parseWatchlistTags(formState.tags)
  };
}

export function toUpdateWatchlistPayload(editState: WatchlistEditState) {
  return {
    note: editState.note || undefined,
    source: editState.source,
    tags: parseWatchlistTags(editState.tags)
  };
}
