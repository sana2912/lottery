import { z } from "zod";

export const watchlistItemSchema = z.object({
  id: z.string(),
  number: z.string(),
  tags: z.array(z.string())
});

export type WatchlistItem = z.infer<typeof watchlistItemSchema>;
