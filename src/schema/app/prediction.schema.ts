import { z } from "zod";

export const predictionSchema = z.object({
  id: z.string(),
  strategy: z.string(),
  numbers: z.array(z.string())
});

export type Prediction = z.infer<typeof predictionSchema>;
