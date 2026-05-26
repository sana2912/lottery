import { describe, expect, test } from "bun:test";
import { buildAnalysisPatternReadModel } from "@/api/service/analysis-snapshot/pattern-read-model";
import { calculateNumberStats, summarizePatterns } from "@/api/service/analytics/number-stats";
import {
  buildPatternReadModel,
  buildPatternReadModelFromSnapshot,
  type PatternPageQuery,
  parsePatternSearchParams
} from "@/frontend/pages/patterns/patterns.mappers";
import { hasNumberShapeFlag, type NumberShapeFlag } from "@/lib/app/number-shape";
import type { ApiAnalyticsReadModel } from "@/schema/api/analytics";
import type { AnalyticsReadModel } from "@/schema/app/analytics.schema";
import type { PatternsApiReadModel } from "@/schema/app/patterns.schema";

const EXPECTED_PATTERN_IDS = {
  2: [
    "odd_last_digit",
    "even_last_digit",
    "high_last_digit",
    "low_last_digit",
    "double",
    "ascending",
    "descending",
    "mirror"
  ],
  3: [
    "has_repeat",
    "all_unique",
    "triple",
    "ascending",
    "descending",
    "palindrome",
    "balanced_odd_even",
    "balanced_high_low",
    "low_sum",
    "mid_sum",
    "high_sum"
  ],
  6: [
    "has_repeat",
    "all_unique",
    "double_pair",
    "triple",
    "quad_or_more",
    "palindrome",
    "balanced_odd_even",
    "balanced_high_low",
    "low_sum",
    "mid_sum",
    "high_sum"
  ]
} as const;

const computedAt = new Date("2026-04-28T00:00:00.000Z");

const fixtures = {
  FIRST: [
    prize("2026-04-01", "123456", "FIRST"),
    prize("2026-04-16", "654321", "FIRST"),
    prize("2026-04-16", "112233", "FIRST"),
    prize("2026-04-01", "907856", "FIRST")
  ],
  THREE_FRONT: [
    prize("2026-04-01", "123", "THREE_FRONT"),
    prize("2026-04-16", "135", "THREE_FRONT"),
    prize("2026-04-16", "121", "THREE_FRONT"),
    prize("2026-04-01", "007", "THREE_FRONT")
  ],
  TWO_DIGIT: [
    prize("2026-04-01", "09", "TWO_DIGIT"),
    prize("2026-04-16", "90", "TWO_DIGIT"),
    prize("2026-04-16", "11", "TWO_DIGIT"),
    prize("2026-04-01", "42", "TWO_DIGIT")
  ]
} as const;

describe("patterns page audit", () => {
  for (const [lengthKey, expectedIds] of Object.entries(EXPECTED_PATTERN_IDS)) {
    const length = Number(lengthKey) as 2 | 3 | 6;
    const prizeKey = length === 2 ? "TWO_DIGIT" : length === 3 ? "THREE_FRONT" : "FIRST";

    test(`prize length ${length} exposes the expected pattern cards`, () => {
      const query: PatternPageQuery = {
        prizeType: prizeKey,
        scope: "ALL_TIME"
      };
      const model = buildPatternReadModel(buildAnalyticsModel(prizeKey), query);

      expect(model.playground.map((item) => item.id)).toEqual([...expectedIds]);
      expect(model.playground.map((item) => item.id)).not.toContain("ascending_run");
      expect(model.playground.map((item) => item.id)).not.toContain("descending_run");
      if (length !== 2 && length !== 3) {
        expect(model.playground.map((item) => item.id)).not.toContain("ascending");
        expect(model.playground.map((item) => item.id)).not.toContain("descending");
      }
    });
  }

  test("overview counts match shape flags for each visible pattern", () => {
    for (const prizeKey of ["TWO_DIGIT", "THREE_FRONT", "FIRST"] as const) {
      const query: PatternPageQuery = { prizeType: prizeKey, scope: "ALL_TIME" };
      const analytics = buildAnalyticsModel(prizeKey);
      const model = buildPatternReadModel(analytics, query);
      const stats = analytics.numberStats.filter((stat) => stat.prizeType === prizeKey);
      const totalHits = stats.reduce((sum, stat) => sum + stat.hitCount, 0);

      for (const card of model.overviewCards) {
        const flag = patternIdToFlag(card.id);
        const expected = stats
          .filter((stat) => hasNumberShapeFlag(stat.number, flag))
          .reduce((sum, stat) => sum + stat.hitCount, 0);

        expect(card.value).toBe(expected);
        expect(card.total).toBe(totalHits);
      }
    }
  });

  test("snapshot overview matches live recompute for the same sample", () => {
    const prizeType = "THREE_FRONT";
    const apiStats = calculateNumberStats(fixtures.THREE_FRONT, {
      computedAt,
      drawCount: 2
    });
    const analytics = toApiAnalyticsReadModel(apiStats, 2);
    const pattern = buildAnalysisPatternReadModel(analytics);
    const snapshot: PatternsApiReadModel = {
      context: {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 3,
        prizeType,
        scope: "ALL_TIME"
      },
      generatedAt: analytics.generatedAt,
      pattern,
      source: "snapshot",
      summary: {
        drawCount: 2,
        generatedAt: analytics.generatedAt
      }
    };
    const query: PatternPageQuery = { prizeType, scope: "ALL_TIME" };
    const snapshotModel = buildPatternReadModelFromSnapshot(snapshot, query);
    const liveModel = buildPatternReadModel(buildAnalyticsModel(prizeType), query);

    for (const card of liveModel.overviewCards) {
      expect(snapshotModel.overviewCards.find((entry) => entry.id === card.id)?.value).toBe(
        card.value
      );
    }
  });

  test("random examples honor the active pattern flag", () => {
    const model = buildPatternReadModel(buildAnalyticsModel("THREE_FRONT"), {
      prizeType: "THREE_FRONT",
      scope: "ALL_TIME",
      pattern: "all_unique",
      exampleSeed: "audit-all-unique"
    });

    expect(model.examples.length).toBeGreaterThan(0);
    expect(
      model.examples.every((example) => hasNumberShapeFlag(example.number, "all_unique"))
    ).toBe(true);
  });

  test("sanitizePatternQuery drops sequence patterns for six-digit prizes", () => {
    expect(
      parsePatternSearchParams({
        pattern: "ascending",
        prizeType: "FIRST",
        scope: "ALL_TIME"
      }).pattern
    ).toBeUndefined();
  });
});

function patternIdToFlag(id: string): NumberShapeFlag {
  const map: Record<string, NumberShapeFlag> = {
    odd_last_digit: "odd",
    even_last_digit: "even",
    high_last_digit: "high",
    low_last_digit: "low",
    double: "double",
    has_repeat: "has_repeat",
    all_unique: "all_unique",
    double_pair: "double_pair",
    triple: "triple",
    quad_or_more: "quad_or_more",
    ascending: "ascending",
    descending: "descending",
    mirror: "mirror",
    palindrome: "palindrome",
    balanced_odd_even: "balanced_odd_even",
    balanced_high_low: "balanced_high_low",
    low_sum: "low_sum",
    mid_sum: "mid_sum",
    high_sum: "high_sum"
  };

  const flag = map[id];

  if (!flag) {
    throw new Error(`Unknown pattern id: ${id}`);
  }

  return flag;
}

function buildAnalyticsModel(prizeType: keyof typeof fixtures): AnalyticsReadModel {
  const apiStats = calculateNumberStats(fixtures[prizeType], {
    computedAt,
    drawCount: 2
  });

  return {
    digitStats: [],
    generatedAt: computedAt.toISOString(),
    numberStats: apiStats.map((stat) => ({
      averageGap: stat.averageGap,
      computedAt: stat.computedAt,
      drawCount: stat.drawCount,
      frequencyPercent: stat.frequencyPercent,
      hitCount: stat.hitCount,
      lastSeenDrawDate: stat.lastSeenDrawDate,
      lotteryType: stat.lotteryType,
      maxGap: stat.maxGap,
      missingDrawCount: stat.missingDrawCount,
      number: stat.number,
      numberLength: stat.numberLength,
      patternFlags: [...stat.patternFlags],
      prizeType: stat.prizeType,
      samplePrizeCount: stat.samplePrizeCount,
      trendScore: stat.trendScore
    })),
    patternSummaries: summarizePatterns(apiStats, 2).map((summary) => ({
      frequencyPercent: summary.frequencyPercent,
      hitCount: summary.hitCount,
      id: summary.id,
      insight: summary.insight,
      label: summary.label,
      pattern: summary.pattern,
      sampleSize: summary.sampleSize
    })),
    source: "api",
    summary: {
      drawCount: 2,
      generatedAt: computedAt.toISOString()
    }
  };
}

function toApiAnalyticsReadModel(
  numberStats: ReturnType<typeof calculateNumberStats>,
  drawCount: number
): ApiAnalyticsReadModel {
  const generatedAt = computedAt.toISOString();

  return {
    digitStats: [],
    generatedAt,
    numberStats,
    patternSummaries: summarizePatterns(numberStats, drawCount),
    source: "api",
    summary: {
      drawCount,
      generatedAt
    }
  };
}

function prize(drawDate: string, number: string, type: string) {
  return {
    draw: {
      drawDate: new Date(`${drawDate}T00:00:00.000Z`),
      lotteryType: "THAI_GOVERNMENT"
    },
    number,
    type
  };
}
