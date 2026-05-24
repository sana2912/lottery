import { Elysia } from "elysia";
import { timeMachineService } from "@/api/service/time-machine/time-machine.service";
import { timeMachineSimulationRequestSchema } from "@/schema/app/time-machine.schema";

export const timeMachineRouter = new Elysia({ prefix: "/time-machine" }).post(
  "/simulations",
  async ({ body, set }) => {
    const parsed = timeMachineSimulationRequestSchema.safeParse(body);

    if (!parsed.success) {
      set.status = 400;

      return {
        error: "Validation failed",
        message: parsed.error.issues.map((issue) => issue.message).join("; ")
      };
    }

    return timeMachineService.runTimeMachineSimulation(parsed.data);
  }
);
