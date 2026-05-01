import { resultsContent } from "@/frontend/pages/results/results.content";
import { toResultsModel, toResultsShellModel } from "@/frontend/pages/results/results.mappers";
import { type SearchQuery, toResultsApiQuery } from "@/frontend/pages/results/results.query";
import { ApiHttpError, apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type Draw,
  type DrawDetailResponse,
  type DrawListResponse,
  drawDetailResponseSchema,
  drawListResponseSchema
} from "@/schema/app/draw.schema";
import { type ResultsReadModel, resultsReadModelSchema } from "@/schema/app/results.schema";

const resultsShell: ResultsReadModel = resultsReadModelSchema.parse({
  contractRows: [
    {
      field: "draw.id",
      purpose: "Primary key used by the results page, detail routes, and API consumers.",
      source: "LotteryDraw.id"
    },
    {
      field: "drawDate",
      purpose: "Human-readable draw date used as the main heading and draw-level filter target.",
      source: "LotteryDraw.drawDate"
    },
    {
      field: "drawDateIso",
      purpose: "ISO date form used for sorting, filtering, and stable API transport.",
      source: "LotteryDraw.drawDate"
    },
    {
      field: "drawNo",
      purpose: "Supports compact draw identification in list and detail views.",
      source: "LotteryDraw.drawNo"
    },
    {
      field: "status",
      purpose: "Machine-readable state such as complete or partial for badges and filtering.",
      source: "computed"
    },
    {
      field: "prizes[]",
      purpose: "Grouped prize rows rendered inside each draw card.",
      source: "LotteryPrize[]"
    },
    {
      field: "prizes[].prizeType",
      purpose: "Enum-backed prize type used for Prisma mapping and filter behavior.",
      source: "LotteryPrize.type"
    },
    {
      field: "coverage",
      purpose: "Summarizes data completeness and QA state for each draw row.",
      source: "computed"
    }
  ],
  draws: [],
  filters: {
    defaultLotteryType: "THAI_GOVERNMENT",
    defaultPrizeType: "FIRST",
    lotteryTypes: ["THAI_GOVERNMENT"],
    prizeTypes: [
      "FIRST",
      "PRIZE2",
      "PRIZE3",
      "PRIZE4",
      "PRIZE5",
      "THREE_DIGIT",
      "THREE_FRONT",
      "THREE_BACK",
      "TWO_DIGIT",
      "NEAR_FIRST"
    ]
  },
  generatedAt: new Date().toISOString(),
  hero: {
    coverageLabel: "Coverage snapshot",
    coverageValue: "-",
    description:
      "Historical draw results and prize groups returned by the /api/draws contract, backed by the database.",
    eyebrow: "Historical results",
    title: "Recent historical draws"
  },
  highlights: [
    {
      description:
        "Each draw card carries a coverage label so missing or partially verified prize rows remain visible.",
      title: "Data quality visibility"
    },
    {
      description:
        "This page defines how draw date, draw number, grouped prizes, and status metadata appear for users.",
      title: "Frontend data contract"
    },
    {
      description:
        "Once /api/draws is fully live, the service response should render here without page-level contract churn.",
      title: "Backend handoff"
    }
  ],
  mockNote: resultsContent.fallbackNotes.error,
  source: "mock",
  stats: [
    {
      hint: resultsContent.stats.latestDrawHint,
      label: resultsContent.stats.latestDrawLabel,
      value: "-"
    },
    {
      hint: resultsContent.stats.drawRecordsHint,
      label: resultsContent.stats.drawRecordsLabel,
      value: "0"
    },
    {
      hint: resultsContent.stats.prizeRecordsHint,
      label: resultsContent.stats.prizeRecordsLabel,
      value: "0"
    }
  ]
});

export type ResultsPageData =
  | { model: ResultsReadModel; state: "error" }
  | { model: ResultsReadModel; state: "ready" }
  | { model: ResultsReadModel; state: "empty" };
export type ResultsDetailData =
  | { draw: Draw; state: "ready" }
  | { draw: null; state: "error" }
  | { draw: null; state: "notFound" };

export async function getResultsPageData(query: SearchQuery): Promise<ResultsPageData> {
  try {
    const response = await apiGet<DrawListResponse>(apiRoutes.draws, {
      cache: "no-store",
      query: toResultsApiQuery(query),
      schema: drawListResponseSchema
    });
    const model = resultsReadModelSchema.parse(
      toResultsModel(response, resultsShell, resultsContent)
    );

    return {
      model,
      state: model.draws.length > 0 ? "ready" : "empty"
    };
  } catch {
    return {
      model: toResultsShellModel(resultsShell, resultsContent.fallbackNotes.error),
      state: "error"
    };
  }
}

export async function getDrawDetail(id: string): Promise<ResultsDetailData> {
  try {
    const response = await apiGet<DrawDetailResponse>(`${apiRoutes.draws}/${id}`, {
      cache: "no-store",
      schema: drawDetailResponseSchema
    });

    return {
      draw: response.draw,
      state: "ready"
    };
  } catch (error) {
    if (error instanceof ApiHttpError && error.status === 404) {
      return {
        draw: null,
        state: "notFound"
      };
    }

    return {
      draw: null,
      state: "error"
    };
  }
}
