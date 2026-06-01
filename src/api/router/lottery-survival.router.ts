import { Elysia } from "elysia";
import { LotterySurvivalTicketGenerationError } from "@/api/service/lottery-survival/generator";
import {
  LotterySurvivalValidationError,
  lotterySurvivalService
} from "@/api/service/lottery-survival/lottery-survival.service";
import { lotterySurvivalRoundRequestSchema } from "@/schema/app/lottery-survival.schema";

export const lotterySurvivalRouter = new Elysia({ prefix: "/lottery-survival" }).post(
  "/rounds",
  async ({ body, set }) => {
    const parsed = lotterySurvivalRoundRequestSchema.safeParse(body);

    if (!parsed.success) {
      set.status = 400;

      return {
        error: "Validation failed",
        message: parsed.error.issues.map((issue) => issue.message).join("; ")
      };
    }

    try {
      return await lotterySurvivalService.runLotterySurvivalRound(parsed.data);
    } catch (error) {
      if (
        error instanceof LotterySurvivalValidationError ||
        error instanceof LotterySurvivalTicketGenerationError
      ) {
        set.status = 400;

        return {
          error: "Validation failed",
          message: error.message
        };
      }

      throw error;
    }
  }
);
