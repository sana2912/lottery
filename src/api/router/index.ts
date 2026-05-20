import { Elysia } from "elysia";
import { analyticsRouter } from "@/api/router/analytics.router";
import { backtestRouter } from "@/api/router/backtest.router";
import { calendarRouter } from "@/api/router/calendar.router";
import { compareRouter } from "@/api/router/compare.router";
import { dashboardRouter } from "@/api/router/dashboard.router";
import { drawRouter } from "@/api/router/draw.router";
import { patternsRouter } from "@/api/router/patterns.router";
import { predictionRouter } from "@/api/router/prediction.router";
import { searchRouter } from "@/api/router/search.router";
import { watchlistRouter } from "@/api/router/watchlist.router";
import { ANALYSIS_ENGINE_VERSION } from "@/api/service/analysis-snapshot/analysis-context";

export function createApiRouter() {
  return new Elysia({ prefix: "/api" })
    .get("/", () => ({
      engineVersion: ANALYSIS_ENGINE_VERSION,
      name: "Lottery Intelligence API",
      status: "ok"
    }))
    .use(drawRouter)
    .use(analyticsRouter)
    .use(patternsRouter)
    .use(predictionRouter)
    .use(backtestRouter)
    .use(compareRouter)
    .use(calendarRouter)
    .use(dashboardRouter)
    .use(searchRouter)
    .use(watchlistRouter);
}
