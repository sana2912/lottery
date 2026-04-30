import { z } from "zod";
import { lotteryPrizeTypeSchema, lotteryTypeSchema } from "@/schema/app/query.schema";
import { sourceStatusInputSchema } from "@/schema/app/source.schema";

const expectedPrizeNumberLength: Partial<
  Record<z.infer<typeof lotteryPrizeTypeSchema>, number | readonly number[]>
> = {
  FIRST: [6, 7],
  NEAR_FIRST: 6,
  PRIZE2: 6,
  PRIZE3: 6,
  PRIZE4: 6,
  PRIZE5: 6,
  THREE_BACK: 3,
  THREE_DIGIT: 3,
  THREE_FRONT: 3,
  TWO_DIGIT: 2
};

const jsonObjectSchema = z.record(z.string(), z.unknown());

const drawDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "drawDate must use YYYY-MM-DD format.")
  .refine(isValidDateOnlyString, "drawDate must be a valid calendar date.");

const dateTimeSchema = z
  .string()
  .trim()
  .refine(isValidDateString, "Expected a valid date or datetime string.");

export const lotteryPrizeSeedSchema = z
  .object({
    number: z.string().trim().regex(/^\d+$/, "Prize number must contain digits only."),
    position: z.number().int().positive().optional(),
    type: lotteryPrizeTypeSchema
  })
  .superRefine((prize, context) => {
    const expectedLength = expectedPrizeNumberLength[prize.type];

    if (typeof expectedLength === "number" && prize.number.length !== expectedLength) {
      context.addIssue({
        code: "custom",
        message: `${prize.type} prize number must be ${expectedLength} digits.`,
        path: ["number"]
      });
    }

    if (Array.isArray(expectedLength) && !expectedLength.includes(prize.number.length)) {
      context.addIssue({
        code: "custom",
        message: `${prize.type} prize number must be ${expectedLength.join(" or ")} digits.`,
        path: ["number"]
      });
    }
  });

export const lotteryDrawSeedSchema = z.object({
  drawDate: drawDateSchema,
  drawNo: z.string().trim().optional(),
  lotteryType: lotteryTypeSchema.optional().default("THAI_GOVERNMENT"),
  metadata: jsonObjectSchema.optional(),
  prizes: z.array(lotteryPrizeSeedSchema).default([]),
  publishedAt: dateTimeSchema.optional(),
  sourceStatus: sourceStatusInputSchema.optional(),
  sourceUrl: z.string().trim().url().optional()
});

export const lotteryDrawSeedFileSchema = z.preprocess(
  (value) => (Array.isArray(value) ? { draws: value } : value),
  z.object({
    draws: z.array(lotteryDrawSeedSchema).min(1),
    source: z
      .object({
        metadata: jsonObjectSchema.optional(),
        name: z.string().trim().optional(),
        publishedAt: dateTimeSchema.optional(),
        status: sourceStatusInputSchema.optional(),
        url: z.string().trim().url().optional()
      })
      .optional()
  })
);

export type LotteryDrawSeedFile = z.infer<typeof lotteryDrawSeedFileSchema>;
export type LotteryDrawSeedInput = z.infer<typeof lotteryDrawSeedSchema>;
export type LotteryPrizeSeedInput = z.infer<typeof lotteryPrizeSeedSchema>;

function isValidDateString(value: string) {
  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

function isValidDateOnlyString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}
