import { toApiCompareReadModel } from "@/api/model/dto/compare.dto";
import { compareReadModelSchema } from "@/schema/app/compare.schema";

const compareFixtureInput = {
  generatedAt: new Date("2026-04-27T00:00:00.000Z"),
  source: "mock",
  candidates: [
    {
      number: "47",
      numberLength: 2,
      score: 82,
      rank: 1,
      scoreBreakdown: {
        hot: 30,
        overdue: 12,
        position: 24,
        pair: 10,
        pattern: 6
      },
      reasons: ["hot trend สูง", "position support ชัด", "pair signal ยังสด"]
    },
    {
      number: "91",
      numberLength: 2,
      score: 68,
      rank: 2,
      scoreBreakdown: {
        hot: 14,
        overdue: 26,
        position: 16,
        pair: 8,
        pattern: 4
      },
      reasons: ["overdue gap สูง", "pair support ปานกลาง"]
    }
  ],
  strongestSignal: "47 มี hot trend สูงกว่าเลขอื่นในชุดเปรียบเทียบ",
  sampleSize: 24
} as const;

export const compareMockReadModel = compareReadModelSchema.parse(
  toApiCompareReadModel(compareFixtureInput)
);
