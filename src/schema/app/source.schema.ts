import { z } from "zod";

export const sourceStatusValues = ["IMPORTED", "PARTIAL", "VERIFIED"] as const;

export const sourceStatusSchema = z.enum(sourceStatusValues);

export const sourceStatusInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  sourceStatusSchema
);

export type SourceStatus = z.infer<typeof sourceStatusSchema>;
