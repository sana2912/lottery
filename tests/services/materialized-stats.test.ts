import { afterEach, describe, expect, test } from "bun:test";
import { getIncrementalMaterializedContexts } from "@/api/service/analytics/materialized-stats";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("materialized-stats", () => {
  test("derives canonical refresh contexts from affected prize types in a date range", async () => {
    let querySeen = "";

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        querySeen = getSqlText(args[0]);

        return [{ prizeType: "FIRST" }, { prizeType: "TWO_DIGIT" }];
      }
    };

    const contexts = await getIncrementalMaterializedContexts({
      endDate: "2026-04-30",
      startDate: "2026-04-01"
    });

    expect(querySeen).toContain('FROM "lottery_prizes"');
    expect(querySeen).toContain('INNER JOIN "lottery_draws"');
    expect(contexts).toEqual([
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        prizeType: "FIRST",
        windowSize: 30
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        prizeType: "FIRST",
        windowSize: 60
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        prizeType: "FIRST",
        windowSize: 120
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 2,
        prizeType: "TWO_DIGIT",
        windowSize: 30
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 2,
        prizeType: "TWO_DIGIT",
        windowSize: 60
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 2,
        prizeType: "TWO_DIGIT",
        windowSize: 120
      }
    ]);
  });
});

function getSqlText(template: unknown) {
  return Array.isArray(template) ? template.join("?") : String(template);
}
