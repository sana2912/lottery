import { z } from "zod";

export const watchlistScopeSchema = z.literal("global");
export const watchlistSourceSchema = z.enum(["MANUAL", "NOTEBOOK", "PREDICTION"]);

export const watchlistItemSchema = z.object({
  createdAt: z.string(),
  id: z.string(),
  note: z.string().optional(),
  number: z.string(),
  scope: watchlistScopeSchema,
  source: watchlistSourceSchema,
  tags: z.array(z.string()),
  updatedAt: z.string()
});

export const watchlistReadModelSchema = z.object({
  generatedAt: z.string(),
  items: z.array(watchlistItemSchema),
  scope: watchlistScopeSchema,
  source: z.literal("api")
});

export const createWatchlistItemSchema = z.object({
  note: z.string().trim().optional(),
  number: z.string().trim().min(1),
  source: watchlistSourceSchema.optional().default("MANUAL"),
  tags: z.array(z.string().trim().min(1)).optional().default([])
});

export const updateWatchlistItemSchema = z.object({
  note: z.string().trim().optional(),
  source: watchlistSourceSchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional()
});

export const deleteWatchlistItemResponseSchema = z.object({
  deleted: z.literal(true),
  id: z.string(),
  scope: watchlistScopeSchema
});

export type CreateWatchlistItem = z.infer<typeof createWatchlistItemSchema>;
export type DeleteWatchlistItemResponse = z.infer<typeof deleteWatchlistItemResponseSchema>;
export type UpdateWatchlistItem = z.infer<typeof updateWatchlistItemSchema>;
export type WatchlistItem = z.infer<typeof watchlistItemSchema>;
export type WatchlistReadModel = z.infer<typeof watchlistReadModelSchema>;
export type WatchlistScope = z.infer<typeof watchlistScopeSchema>;
export type WatchlistSource = z.infer<typeof watchlistSourceSchema>;
