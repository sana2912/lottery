import { z } from "zod";

export const drawSchema = z.object({
  id: z.string(),
  drawDate: z.string(),
  lotteryType: z.string()
});

export type Draw = z.infer<typeof drawSchema>;
