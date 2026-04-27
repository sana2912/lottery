import { z } from "zod";

export const resultDrawStatusSchema = z.enum(["complete", "partial", "imported"]);

export const resultsReadModelSchema = z.object({
  generatedAt: z.string(),
  source: z.enum(["mock", "api"]),
  hero: z.object({
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    coverageLabel: z.string(),
    coverageValue: z.string()
  }),
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      hint: z.string()
    })
  ),
  filters: z.object({
    lotteryTypes: z.array(z.string()),
    prizeTypes: z.array(z.string()),
    defaultLotteryType: z.string(),
    defaultPrizeType: z.string()
  }),
  highlights: z.array(
    z.object({
      title: z.string(),
      description: z.string()
    })
  ),
  draws: z.array(
    z.object({
      id: z.string(),
      drawDate: z.string(),
      drawDateIso: z.string(),
      drawNo: z.string(),
      lotteryType: z.string(),
      status: resultDrawStatusSchema,
      statusLabel: z.string(),
      coverage: z.string(),
      prizes: z.array(
        z.object({
          label: z.string(),
          value: z.string(),
          prizeType: z.string()
        })
      )
    })
  ),
  contractRows: z.array(
    z.object({
      field: z.string(),
      source: z.string(),
      purpose: z.string()
    })
  ),
  mockNote: z.string()
});

export type ResultsReadModel = z.infer<typeof resultsReadModelSchema>;
export type ResultDraw = ResultsReadModel["draws"][number];
