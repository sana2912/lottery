import { z } from "zod";
import { lotteryTypeSchema } from "@/schema/app/query.schema";

const sixDigitTicketSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Each ticket must be exactly 6 digits.");

export const timeMachineSegmentSchema = z.enum(["full6", "front3", "back3", "last2"]);

export const timeMachineTimelineKindSchema = z.enum(["pass", "hit", "nearMiss"]);

export const timeMachineSimulationRequestSchema = z.object({
  lotteryType: lotteryTypeSchema.default("THAI_GOVERNMENT"),
  startYear: z.coerce.number().int().min(1992).max(3000).default(1992),
  tickets: z.array(sixDigitTicketSchema).min(1).max(4)
});

export const timeMachineTicketShapeSchema = z.object({
  number: z.string()
});

export const timeMachineDrawPrizeSchema = z.object({
  label: z.string(),
  number: z.string(),
  position: z.number().int().optional(),
  type: z.string()
});

export const timeMachineHitEventSchema = z.object({
  matchedDigits: z.number().int(),
  points: z.number(),
  prizeNumber: z.string(),
  prizeType: z.string(),
  segment: timeMachineSegmentSchema,
  ticket: z.string()
});

export const timeMachineNearMissEventSchema = z.object({
  cinematicCopy: z.string(),
  digitDistance: z.number().int(),
  matchedDigits: z.number().int(),
  matchedPositions: z.array(z.number().int()),
  points: z.number(),
  prizeNumber: z.string(),
  prizeType: z.literal("FIRST"),
  ticket: z.string()
});

export const timeMachineTimelineEventSchema = z.object({
  drawDateIso: z.string(),
  drawDateLabel: z.string(),
  drawId: z.string(),
  drawPrizes: z.array(timeMachineDrawPrizeSchema),
  hits: z.array(timeMachineHitEventSchema).optional(),
  kind: timeMachineTimelineKindSchema,
  nearMiss: timeMachineNearMissEventSchema.optional(),
  runningScore: z.number(),
  scoreDelta: z.number(),
  year: z.number().int()
});

export const timeMachineHitCountsSchema = z.object({
  first: z.number().int(),
  nearFirst: z.number().int(),
  otherSixDigit: z.number().int(),
  threeDigit: z.number().int(),
  twoDigit: z.number().int(),
  total: z.number().int()
});

export const timeMachineChartPointSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number()
});

export const timeMachineSummarySchema = z.object({
  bestNearMiss: timeMachineNearMissEventSchema.optional(),
  chartScoreByYear: z.array(timeMachineChartPointSchema),
  closestFirstMoment: timeMachineNearMissEventSchema.optional(),
  hitCounts: timeMachineHitCountsSchema,
  longestQuietStreak: z.number().int(),
  totalScore: z.number()
});

export const timeMachineSimulationMetaSchema = z.object({
  drawCount: z.number().int(),
  endDateIso: z.string(),
  generatedAt: z.string(),
  lotteryType: lotteryTypeSchema,
  startDateIso: z.string(),
  ticketCount: z.number().int()
});

export const timeMachineSimulationResponseSchema = z.object({
  meta: timeMachineSimulationMetaSchema,
  summary: timeMachineSummarySchema,
  tickets: z.array(timeMachineTicketShapeSchema),
  timeline: z.array(timeMachineTimelineEventSchema)
});

export type TimeMachineSegment = z.infer<typeof timeMachineSegmentSchema>;
export type TimeMachineTimelineKind = z.infer<typeof timeMachineTimelineKindSchema>;
export type TimeMachineSimulationRequest = z.infer<typeof timeMachineSimulationRequestSchema>;
export type TimeMachineTicketShape = z.infer<typeof timeMachineTicketShapeSchema>;
export type TimeMachineDrawPrize = z.infer<typeof timeMachineDrawPrizeSchema>;
export type TimeMachineHitEvent = z.infer<typeof timeMachineHitEventSchema>;
export type TimeMachineHitCounts = z.infer<typeof timeMachineHitCountsSchema>;
export type TimeMachineNearMissEvent = z.infer<typeof timeMachineNearMissEventSchema>;
export type TimeMachineTimelineEvent = z.infer<typeof timeMachineTimelineEventSchema>;
export type TimeMachineChartPoint = z.infer<typeof timeMachineChartPointSchema>;
export type TimeMachineSummary = z.infer<typeof timeMachineSummarySchema>;
export type TimeMachineSimulationResponse = z.infer<typeof timeMachineSimulationResponseSchema>;
