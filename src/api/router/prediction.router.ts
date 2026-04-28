import { Elysia } from "elysia";
import { predictionService } from "@/api/service/prediction.service";
import { predictionRequestSchema } from "@/schema/app/prediction.schema";
import { notImplemented } from "@/util/api/response";

export const predictionRouter = new Elysia({ prefix: "/predictions" })
  .get("/", notImplemented)
  .post("/", async ({ body }) => predictionService.generate(predictionRequestSchema.parse(body)));
