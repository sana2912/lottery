import { apiPost } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type LotterySurvivalRoundRequest,
  type LotterySurvivalRoundResponse,
  lotterySurvivalRoundResponseSchema
} from "@/schema/app/lottery-survival.schema";

export async function runLotterySurvivalRound(payload: LotterySurvivalRoundRequest) {
  return apiPost<LotterySurvivalRoundResponse>(apiRoutes.lotterySurvivalRounds, payload, {
    schema: lotterySurvivalRoundResponseSchema
  });
}
