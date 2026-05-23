import { describe, expect, test } from "bun:test";
import { buildPatternReadModelFromSnapshot } from "@/frontend/pages/patterns/patterns.mappers";
import {
  buildPatternPlaygroundOptions,
  formatPatternOptionLabel,
  getPatternDefinitionsForPrizeType,
  matchesAllPatternIds,
  normalizePatternIdsForPrize
} from "@/lib/app/pattern-playground";
import type { PatternsApiReadModel } from "@/schema/app/patterns.schema";

describe("pattern-playground", () => {
  test("buildPatternPlaygroundOptions matches overview card percents from snapshot", () => {
    const snapshot = createPatternSnapshot();
    const query = { prizeType: "TWO_DIGIT" as const, scope: "ALL_TIME" as const };
    const definitions = getPatternDefinitionsForPrizeType(query.prizeType);
    const options = buildPatternPlaygroundOptions(snapshot.pattern, definitions);
    const model = buildPatternReadModelFromSnapshot(snapshot, query);

    for (const card of model.overviewCards) {
      const option = options.find((entry) => entry.id === card.id);
      expect(option?.percent).toBe(card.percent);
      expect(option?.hitCount).toBe(card.value);
    }
  });

  test("formatPatternOptionLabel appends percent suffix", () => {
    expect(formatPatternOptionLabel("Has repeat", 84.96)).toBe("Has repeat — 84.96%");
  });

  test("matchesAllPatternIds requires every selected pattern", () => {
    expect(matchesAllPatternIds("12", ["ascending"], "TWO_DIGIT")).toBe(true);
    expect(matchesAllPatternIds("11", ["ascending"], "TWO_DIGIT")).toBe(false);
    expect(matchesAllPatternIds("12", ["ascending", "odd_last_digit"], "TWO_DIGIT")).toBe(false);
  });

  test("normalizePatternIdsForPrize drops invalid ids for prize length", () => {
    expect(normalizePatternIdsForPrize(["has_repeat", "ascending"], "FIRST")).toEqual([
      "has_repeat"
    ]);
  });
});

function createPatternSnapshot(): PatternsApiReadModel {
  return {
    context: {
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME",
      windowPreset: "ALL",
      windowSize: 4
    },
    generatedAt: "2026-04-28T00:00:00.000Z",
    pattern: {
      distribution: [],
      examples: [],
      overview: [
        {
          examples: ["11"],
          hitCount: 1,
          id: "has_repeat",
          label: "has_repeat",
          pattern: "has_repeat",
          percent: 25,
          sampleSize: 4
        },
        {
          examples: ["12"],
          hitCount: 1,
          id: "ascending",
          label: "ascending",
          pattern: "ascending",
          percent: 25,
          sampleSize: 4
        }
      ],
      sampleSize: 4
    },
    source: "snapshot",
    summary: {
      drawCount: 2,
      generatedAt: "2026-04-28T00:00:00.000Z"
    }
  };
}
