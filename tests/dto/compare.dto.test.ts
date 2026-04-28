import { describe, expect, test } from "bun:test";
import { toApiCompareCandidate, toApiCompareReadModel } from "@/api/model/dto/compare.dto";
import { compareReadModelSchema } from "@/schema/app/compare.schema";

describe("compare.dto", () => {
  test("normalizes generatedAt, copies collections, and strips unknown fields", () => {
    const reasons = ["Hot streak", "Mirror pattern"] as const;
    const breakdown = {
      hot: 12,
      overdue: 5,
      pair: 7,
      pattern: 11,
      position: 9
    };
    const candidate = toApiCompareCandidate({
      extra: "skip",
      number: "09",
      numberLength: 2,
      rank: 1,
      reasons,
      score: 44,
      scoreBreakdown: breakdown
    } as never);

    expect(candidate.reasons).toEqual(["Hot streak", "Mirror pattern"]);
    expect(candidate.reasons).not.toBe(reasons);
    expect(candidate.scoreBreakdown).toEqual(breakdown);
    expect(candidate.scoreBreakdown).not.toBe(breakdown);
    expect(candidate).not.toHaveProperty("extra");

    const model = toApiCompareReadModel({
      candidates: [candidate],
      generatedAt: new Date("2026-04-29T00:00:00.000Z"),
      sampleSize: 120,
      source: "api",
      strategyId: "balanced",
      strongestSignal: "pattern"
    });

    expect(model.generatedAt).toBe("2026-04-29T00:00:00.000Z");
    expect(compareReadModelSchema.parse(model)).toEqual(model);
  });
});
