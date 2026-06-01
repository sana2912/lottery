import { z } from "zod";
import { lotteryPrizeTypeSchema, lotteryTypeSchema } from "@/schema/app/query.schema";
import { timeMachineSegmentSchema } from "@/schema/app/time-machine.schema";

const sixDigitTicketSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Ticket numbers must be exactly 6 digits.");

const favoriteDigitSchema = z.string().regex(/^\d$/, "Favorite digits must be 0-9.");

export const lotterySurvivalStrategySchema = z.enum([
  "random",
  "pattern",
  "favorite",
  "patternFavorite"
]);

export const lotterySurvivalTicketSourceSchema = z.enum(["generated", "manual"]);

export const lotterySurvivalNearMissCategorySchema = z.enum([
  "FIRST_LAST_FIVE",
  "FIRST_ONE_DIGIT",
  "FRONT_OR_BACK_THREE",
  "LAST_TWO",
  "MULTIPLE_NEAR_MISSES"
]);

export const lotterySurvivalRoundRequestSchema = z
  .object({
    balanceBefore: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    favoriteDigits: z.array(favoriteDigitSchema).length(2).optional(),
    manualTickets: z.array(sixDigitTicketSchema).max(20).optional(),
    patternId: z.string().trim().min(1).optional(),
    roundIndex: z.number().int().positive(),
    strategy: lotterySurvivalStrategySchema
  })
  .superRefine((value, context) => {
    if (
      (value.strategy === "favorite" || value.strategy === "patternFavorite") &&
      !value.favoriteDigits
    ) {
      context.addIssue({
        code: "custom",
        message: "Favorite digit strategies require exactly 2 favorite digits.",
        path: ["favoriteDigits"]
      });
    }

    if (
      value.favoriteDigits &&
      new Set(value.favoriteDigits).size !== value.favoriteDigits.length
    ) {
      context.addIssue({
        code: "custom",
        message: "Favorite digits must be unique.",
        path: ["favoriteDigits"]
      });
    }

    if (
      (value.strategy === "pattern" || value.strategy === "patternFavorite") &&
      !value.patternId
    ) {
      context.addIssue({
        code: "custom",
        message: "Pattern strategies require a pattern id.",
        path: ["patternId"]
      });
    }
  });

export const lotterySurvivalPrizeSchema = z.object({
  label: z.string(),
  number: z.string(),
  position: z.number().int().optional(),
  type: lotteryPrizeTypeSchema
});

export const lotterySurvivalDrawSchema = z.object({
  drawDateIso: z.string(),
  drawDateLabel: z.string(),
  drawNo: z.string().optional(),
  id: z.string(),
  prizes: z.array(lotterySurvivalPrizeSchema),
  sourceStatus: z.enum(["IMPORTED", "PARTIAL", "VERIFIED"])
});

export const lotterySurvivalTicketPreviewItemSchema = z.object({
  id: z.string(),
  number: z.string(),
  source: lotterySurvivalTicketSourceSchema
});

export const lotterySurvivalTicketPreviewSchema = z.object({
  items: z.array(lotterySurvivalTicketPreviewItemSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative()
});

export const lotterySurvivalHitSchema = z.object({
  matchedDigits: z.number().int().nonnegative(),
  prizeAmount: z.number().int().nonnegative(),
  prizeLabel: z.string(),
  prizeNumber: z.string(),
  prizeType: lotteryPrizeTypeSchema,
  quantity: z.number().int().positive(),
  segment: timeMachineSegmentSchema,
  ticket: z.string(),
  totalPrize: z.number().int().nonnegative()
});

export const lotterySurvivalPrizeBreakdownItemSchema = z.object({
  groupedEntryCount: z.number().int().nonnegative(),
  prizeLabel: z.string(),
  prizeType: lotteryPrizeTypeSchema,
  rawMatchCount: z.number().int().nonnegative(),
  subtotal: z.number().int().nonnegative()
});

export const lotterySurvivalWinBreakdownSchema = z.object({
  byPrizeType: z.array(lotterySurvivalPrizeBreakdownItemSchema),
  totalGroupedWinningEntries: z.number().int().nonnegative(),
  totalPrizeMoney: z.number().int().nonnegative(),
  totalRawWinningMatches: z.number().int().nonnegative()
});

export const lotterySurvivalNearMissSchema = z.object({
  category: lotterySurvivalNearMissCategorySchema,
  description: z.string(),
  digitDistance: z.number().int().nonnegative(),
  id: z.string(),
  label: z.string(),
  matchedDigits: z.number().int().nonnegative(),
  matchedPositions: z.array(z.number().int().nonnegative()),
  prizeNumber: z.string(),
  prizeType: lotteryPrizeTypeSchema,
  quantity: z.number().int().positive(),
  severity: z.number().int().nonnegative(),
  ticket: z.string()
});

export const lotterySurvivalRoundResponseSchema = z.object({
  balanceAfter: z.number().int().nonnegative(),
  balanceBefore: z.number().int().nonnegative(),
  carryOver: z.number().int().nonnegative(),
  draw: lotterySurvivalDrawSchema,
  generatedCount: z.number().int().nonnegative(),
  lotteryType: lotteryTypeSchema,
  manualCount: z.number().int().nonnegative(),
  narratorMessage: z.string(),
  nearMisses: z.array(lotterySurvivalNearMissSchema),
  prizeTotal: z.number().int().nonnegative(),
  purchaseCost: z.number().int().nonnegative(),
  roundIndex: z.number().int().positive(),
  ticketCount: z.number().int().nonnegative(),
  ticketPreview: lotterySurvivalTicketPreviewSchema,
  winBreakdown: lotterySurvivalWinBreakdownSchema,
  winningTickets: z.array(lotterySurvivalHitSchema)
});

export type LotterySurvivalStrategy = z.infer<typeof lotterySurvivalStrategySchema>;
export type LotterySurvivalTicketSource = z.infer<typeof lotterySurvivalTicketSourceSchema>;
export type LotterySurvivalNearMissCategory = z.infer<typeof lotterySurvivalNearMissCategorySchema>;
export type LotterySurvivalRoundRequest = z.infer<typeof lotterySurvivalRoundRequestSchema>;
export type LotterySurvivalPrize = z.infer<typeof lotterySurvivalPrizeSchema>;
export type LotterySurvivalDraw = z.infer<typeof lotterySurvivalDrawSchema>;
export type LotterySurvivalTicketPreviewItem = z.infer<
  typeof lotterySurvivalTicketPreviewItemSchema
>;
export type LotterySurvivalTicketPreview = z.infer<typeof lotterySurvivalTicketPreviewSchema>;
export type LotterySurvivalHit = z.infer<typeof lotterySurvivalHitSchema>;
export type LotterySurvivalPrizeBreakdownItem = z.infer<
  typeof lotterySurvivalPrizeBreakdownItemSchema
>;
export type LotterySurvivalWinBreakdown = z.infer<typeof lotterySurvivalWinBreakdownSchema>;
export type LotterySurvivalNearMiss = z.infer<typeof lotterySurvivalNearMissSchema>;
export type LotterySurvivalRoundResponse = z.infer<typeof lotterySurvivalRoundResponseSchema>;
