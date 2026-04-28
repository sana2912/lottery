import { z } from "zod";

export const drawStatusSchema = z.enum(["complete", "partial", "imported"]);

export const drawPrizeSchema = z.object({
  id: z.string(),
  label: z.string(),
  number: z.string(),
  position: z.number().int().optional(),
  type: z.string()
});

export const drawSchema = z.object({
  id: z.string(),
  drawDate: z.string(),
  drawDateIso: z.string(),
  drawNo: z.string(),
  lotteryType: z.string(),
  status: drawStatusSchema,
  statusLabel: z.string(),
  coverage: z.string(),
  prizes: z.array(drawPrizeSchema)
});

export const drawListResponseSchema = z.object({
  draws: z.array(drawSchema),
  filters: z.object({
    endDate: z.string().optional(),
    lotteryType: z.string(),
    month: z.number().int().optional(),
    prizeType: z.string().optional(),
    q: z.string().optional(),
    startDate: z.string().optional(),
    year: z.number().int().optional()
  }),
  generatedAt: z.string(),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0)
  }),
  source: z.literal("api")
});

export const drawDetailResponseSchema = z.object({
  draw: drawSchema,
  generatedAt: z.string(),
  source: z.literal("api")
});

export type Draw = z.infer<typeof drawSchema>;
export type DrawPrize = z.infer<typeof drawPrizeSchema>;
export type DrawListResponse = z.infer<typeof drawListResponseSchema>;
export type DrawDetailResponse = z.infer<typeof drawDetailResponseSchema>;
