import { Elysia } from "elysia";
import { analyticsRouter } from "@/api/router/analytics.router";
import { backtestRouter } from "@/api/router/backtest.router";
import { calendarRouter } from "@/api/router/calendar.router";
import { compareRouter } from "@/api/router/compare.router";
import { drawRouter } from "@/api/router/draw.router";
import { predictionRouter } from "@/api/router/prediction.router";
import { watchlistRouter } from "@/api/router/watchlist.router";

export function createApiRouter() {
  return new Elysia({ prefix: "/api" })
    .get("/", () => ({
      name: "Lottery Intelligence API",
      status: "scaffold"
    }))
    .use(drawRouter)
    .use(analyticsRouter)
    .use(predictionRouter)
    .use(backtestRouter)
    .use(compareRouter)
    .use(calendarRouter)
    .use(watchlistRouter);
}
