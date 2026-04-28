import { type CompareReadModel, compareReadModelSchema } from "@/schema/app/compare.schema";

export const compareFallback = compareReadModelSchema.parse({
  candidates: [
    {
      number: "47",
      numberLength: 2,
      rank: 1,
      reasons: ["Hot trend is strong in the sampled window.", "Position support remains stable."],
      score: 82,
      scoreBreakdown: {
        hot: 30,
        overdue: 12,
        pair: 10,
        pattern: 6,
        position: 24
      }
    },
    {
      number: "91",
      numberLength: 2,
      rank: 2,
      reasons: ["Overdue gap is elevated.", "Pair support is moderate."],
      score: 68,
      scoreBreakdown: {
        hot: 14,
        overdue: 26,
        pair: 8,
        pattern: 4,
        position: 16
      }
    }
  ],
  generatedAt: "2026-04-28T00:00:00.000Z",
  sampleSize: 24,
  source: "mock",
  strongestSignal: "hot"
});

export type ComparePageModel = CompareReadModel;
