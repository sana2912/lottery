import type {
  ApiAnalyticsReadModel,
  ApiDigitStat,
  ApiNumberStat,
  ApiPatternSummary
} from "@/schema/api/analytics";
import type { ApiCalendarReadModel } from "@/schema/api/calendar";
import type { ApiCompareReadModel, ApiCompareRequest } from "@/schema/api/compare";
import type { ApiDashboardReadModel } from "@/schema/api/dashboard";
import type { ApiDrawDetailResponse, ApiDrawListResponse } from "@/schema/api/draw";
import type { ApiPredictionRequest, ApiPredictionResponse } from "@/schema/api/prediction";
import type { ApiResultsReadModel } from "@/schema/api/results";
import type {
  AnalyticsReadModel,
  DigitStat,
  NumberStat,
  PatternSummary
} from "@/schema/app/analytics.schema";
import type { CalendarReadModel } from "@/schema/app/calendar.schema";
import type { CompareReadModel, CompareRequest } from "@/schema/app/compare.schema";
import type { DashboardReadModel } from "@/schema/app/dashboard.schema";
import type { DrawDetailResponse, DrawListResponse } from "@/schema/app/draw.schema";
import type { PredictionRequest, PredictionResponse } from "@/schema/app/prediction.schema";
import type { ResultsReadModel } from "@/schema/app/results.schema";

type Assert<T extends true> = T;
type IsExtends<Actual, Expected> = [Actual] extends [Expected] ? true : false;
type IsExact<Actual, Expected> = [Actual] extends [Expected]
  ? [Expected] extends [Actual]
    ? true
    : false
  : false;

type _AnalyticsReadModelContract = Assert<IsExact<AnalyticsReadModel, ApiAnalyticsReadModel>>;
type _DigitStatContract = Assert<IsExact<DigitStat, ApiDigitStat>>;
type _NumberStatContract = Assert<IsExact<NumberStat, ApiNumberStat>>;
type _PatternSummaryContract = Assert<IsExact<PatternSummary, ApiPatternSummary>>;

type _CalendarReadModelContract = Assert<IsExact<CalendarReadModel, ApiCalendarReadModel>>;

type _CompareReadModelContract = Assert<IsExact<CompareReadModel, ApiCompareReadModel>>;
type _CompareRequestContract = Assert<IsExtends<CompareRequest, ApiCompareRequest>>;

type _DashboardReadModelContract = Assert<IsExact<DashboardReadModel, ApiDashboardReadModel>>;

type _DrawListResponseContract = Assert<IsExact<DrawListResponse, ApiDrawListResponse>>;
type _DrawDetailResponseContract = Assert<IsExact<DrawDetailResponse, ApiDrawDetailResponse>>;

type _PredictionResponseContract = Assert<IsExact<PredictionResponse, ApiPredictionResponse>>;
type _PredictionRequestContract = Assert<
  IsExtends<PredictionRequest, Required<ApiPredictionRequest>>
>;

type _ResultsReadModelContract = Assert<IsExact<ResultsReadModel, ApiResultsReadModel>>;
