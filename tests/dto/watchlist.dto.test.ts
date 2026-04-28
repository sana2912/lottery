import { describe, expect, test } from "bun:test";
import { toApiWatchlistItem, toApiWatchlistReadModel } from "@/api/model/dto/watchlist.dto";
import { watchlistReadModelSchema } from "@/schema/app/watchlist.schema";

describe("watchlist.dto", () => {
  test("normalizes dates, coerces null note to undefined, and copies tags", () => {
    const input = {
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      id: "watch-1",
      note: null,
      number: "09",
      source: "MANUAL",
      tags: ["hot", "shortlist"] as const,
      updatedAt: new Date("2026-04-29T00:00:00.000Z")
    };
    const item = toApiWatchlistItem({ ...input, internalOnly: "skip" } as never);

    expect(item.createdAt).toBe("2026-04-01T00:00:00.000Z");
    expect(item.updatedAt).toBe("2026-04-29T00:00:00.000Z");
    expect(item.note).toBeUndefined();
    expect(item.scope).toBe("global");
    expect(item.tags).toEqual(["hot", "shortlist"]);
    expect(item.tags).not.toBe(input.tags);
    expect(item).not.toHaveProperty("internalOnly");

    const readModel = toApiWatchlistReadModel([item]);

    expect(readModel.scope).toBe("global");
    expect(readModel.source).toBe("api");
    expect(Date.parse(readModel.generatedAt)).not.toBeNaN();
    expect(watchlistReadModelSchema.parse(readModel)).toEqual(readModel);
  });
});
