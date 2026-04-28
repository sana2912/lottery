import { Elysia } from "elysia";
import { compareService } from "@/api/service/compare.service";
import { compareRequestSchema } from "@/schema/app/compare.schema";

export const compareRouter = new Elysia({ prefix: "/compare" }).post("/", async ({ body }) =>
  compareService.compareNumbers(compareRequestSchema.parse(body))
);
