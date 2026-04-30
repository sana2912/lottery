import { apiPost } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type CompareReadModel,
  type CompareRequest,
  compareReadModelSchema
} from "@/schema/app/compare.schema";

export async function runCompareRequest(payload: CompareRequest) {
  return apiPost<CompareReadModel>(apiRoutes.compare, payload, {
    schema: compareReadModelSchema
  });
}

export type ComparePageModel = CompareReadModel;
