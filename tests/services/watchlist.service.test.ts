import { afterEach, describe, expect, test } from "bun:test";
import {
  createWatchlistItem,
  deleteWatchlistItem,
  getWatchlist,
  updateWatchlistItem
} from "@/api/service/watchlist.service";
import {
  deleteWatchlistItemResponseSchema,
  watchlistItemSchema,
  watchlistReadModelSchema
} from "@/schema/app/watchlist.schema";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("watchlist.service", () => {
  test("lists items ordered by updatedAt desc and returns schema-valid read model", async () => {
    let receivedArgs: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      userWatchlistItem: {
        findMany: async (args: unknown) => {
          receivedArgs = args;
          return [watchItem("watch-1", "09", "MANUAL", ["hot"], undefined)];
        }
      }
    };

    const response = await getWatchlist();

    expect(receivedArgs).toEqual({
      orderBy: {
        updatedAt: "desc"
      }
    });
    expect(watchlistReadModelSchema.parse(response)).toEqual(response);
  });

  test("creates, updates, and deletes watchlist items with the expected payloads", async () => {
    const calls: Record<string, unknown> = {};

    (globalThis as { prisma?: unknown }).prisma = {
      userWatchlistItem: {
        create: async (args: unknown) => {
          calls.create = args;
          return watchItem("watch-1", "09", "MANUAL", ["hot"], "note");
        },
        delete: async (args: unknown) => {
          calls.delete = args;
          return null;
        },
        update: async (args: unknown) => {
          calls.update = args;
          return watchItem("watch-1", "09", "PREDICTION", ["pair"], "updated");
        }
      }
    };

    const created = await createWatchlistItem({
      note: "note",
      number: "09",
      source: "MANUAL",
      tags: ["hot"]
    });
    const updated = await updateWatchlistItem("watch-1", {
      note: "updated",
      source: "PREDICTION",
      tags: ["pair"]
    });
    const deleted = await deleteWatchlistItem("watch-1");

    expect(calls.create).toEqual({
      data: {
        note: "note",
        number: "09",
        source: "MANUAL",
        tags: ["hot"]
      }
    });
    expect(calls.update).toEqual({
      data: {
        note: "updated",
        source: "PREDICTION",
        tags: ["pair"]
      },
      where: {
        id: "watch-1"
      }
    });
    expect(calls.delete).toEqual({
      where: {
        id: "watch-1"
      }
    });
    expect(watchlistItemSchema.parse(created)).toEqual(created);
    expect(watchlistItemSchema.parse(updated)).toEqual(updated);
    expect(deleteWatchlistItemResponseSchema.parse(deleted)).toEqual(deleted);
  });
});

function watchItem(
  id: string,
  number: string,
  source: "MANUAL" | "NOTEBOOK" | "PREDICTION",
  tags: string[],
  note: string | undefined
) {
  return {
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    id,
    note,
    number,
    source,
    tags,
    updatedAt: new Date("2026-04-29T00:00:00.000Z")
  };
}
