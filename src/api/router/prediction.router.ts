import { Elysia } from "elysia";
import { predictionService } from "@/api/service/prediction.service";
import { predictionRequestSchema } from "@/schema/app/prediction.schema";

export const predictionRouter = new Elysia({ prefix: "/predictions" })
  .get("/", async ({ set }) => {
    const prediction = await predictionService.getLatestPrediction();

    if (!prediction) {
      set.status = 404;

      return {
        error: "Not found",
        message: "Prediction run not found"
      };
    }

    return prediction;
  })
  .get("/:id", async ({ params, set }) => {
    const prediction = await predictionService.getPredictionById(params.id);

    if (!prediction) {
      set.status = 404;

      return {
        error: "Not found",
        message: "Prediction run not found"
      };
    }

    return prediction;
  })
  .post("/", async ({ body }) => predictionService.generate(predictionRequestSchema.parse(body)));
