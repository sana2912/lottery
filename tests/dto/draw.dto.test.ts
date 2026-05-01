import { describe, expect, test } from "bun:test";
import {
  toApiDraw,
  toApiDrawDetailResponse,
  toApiDrawListResponse
} from "@/api/model/dto/draw.dto";
import { drawDetailResponseSchema, drawListResponseSchema } from "@/schema/app/draw.schema";

describe("draw.dto", () => {
  test("sorts prizes, normalizes draw fields, and returns schema-valid responses", () => {
    const rawDraw = {
      drawDate: new Date("2026-04-16T00:00:00.000Z"),
      drawNo: null,
      id: "draw-1",
      lotteryType: "THAI_GOVERNMENT",
      metadata: {
        sourceRecordId: "2026-04-16"
      },
      publishedAt: new Date("2026-04-16T09:00:00.000Z"),
      prizes: [
        { id: "p3", number: "09", position: undefined, type: "TWO_DIGIT" },
        { id: "p1", number: "123456", position: undefined, type: "FIRST" },
        { id: "p2", number: "321", position: 2, type: "THREE_FRONT" }
      ],
      sourceStatus: "VERIFIED",
      sourceUrl: "https://example.com/draws/2026-04-16"
    };
    const draw = toApiDraw(rawDraw);

    expect(draw.drawDateIso).toBe("2026-04-16T00:00:00.000Z");
    expect(draw.drawNo).toBe("");
    expect(draw.status).toBe("complete");
    expect(draw.sourceStatus).toBe("VERIFIED");
    expect(draw.sourceUrl).toBe("https://example.com/draws/2026-04-16");
    expect(draw.publishedAt).toBe("2026-04-16T09:00:00.000Z");
    expect(draw.metadata).toEqual({ sourceRecordId: "2026-04-16" });
    expect(draw.coverage).toBe("3 prize records");
    expect(draw.prizes.map((prize) => prize.id)).toEqual(["p1", "p2", "p3"]);

    const listResponse = toApiDrawListResponse({
      draws: [rawDraw],
      filters: {
        endDate: undefined,
        lotteryType: "THAI_GOVERNMENT",
        month: 4,
        prizeType: "TWO_DIGIT",
        q: "09",
        startDate: "2026-04-01",
        year: 2026
      },
      generatedAt: new Date("2026-04-29T00:00:00.000Z"),
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1
      }
    });
    const detailResponse = toApiDrawDetailResponse({
      drawDate: new Date("2026-04-16T00:00:00.000Z"),
      drawNo: "08/2026",
      id: "draw-1",
      lotteryType: "THAI_GOVERNMENT",
      prizes: [{ id: "p1", number: "123456", position: undefined, type: "FIRST" }],
      sourceStatus: "IMPORTED"
    });

    expect(drawListResponseSchema.parse(listResponse)).toEqual(listResponse);
    expect(drawDetailResponseSchema.parse(detailResponse)).toEqual(detailResponse);
    expect(detailResponse.draw.status).toBe("imported");
    expect(Date.parse(detailResponse.generatedAt)).not.toBeNaN();
  });
});
