import { Elysia } from "elysia";
import { backtestService } from "@/api/service/backtest.service";
import { backtestRequestSchema } from "@/schema/app/backtest.schema";

export const backtestRouter = new Elysia({ prefix: "/backtests" })
  .get("/", () => backtestService.listBacktests())
  .get("/:id", async ({ params, set }) => {
    const response = await backtestService.getBacktestById(params.id);

    if (!response) {
      set.status = 404;

      return {
        error: "Not found",
        message: "Backtest run not found"
      };
    }

    return response;
  })
  .post("/", async ({ body }) => backtestService.runBacktest(backtestRequestSchema.parse(body)));
