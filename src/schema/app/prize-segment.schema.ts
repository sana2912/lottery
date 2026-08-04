import { z } from "zod";

export const prizeSegmentSchema = z.enum(["full6", "front3", "back3", "last2"]);

export type PrizeSegment = z.infer<typeof prizeSegmentSchema>;
