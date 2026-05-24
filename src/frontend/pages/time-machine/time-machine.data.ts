import { apiPost } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type TimeMachineSimulationRequest,
  type TimeMachineSimulationResponse,
  timeMachineSimulationResponseSchema
} from "@/schema/app/time-machine.schema";

export async function runTimeMachineSimulation(payload: TimeMachineSimulationRequest) {
  return apiPost<TimeMachineSimulationResponse>(apiRoutes.timeMachineSimulations, payload, {
    schema: timeMachineSimulationResponseSchema
  });
}
