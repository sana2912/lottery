import { Elysia } from "elysia";
import { analyticsService } from "@/api/service/analytics.service";
import { filterContextSchema } from "@/schema/app/query.schema";
import { parseQuery } from "@/util/api/query";

export const analyticsRouter = new Elysia({ prefix: "/analytics" })
  .get("/", ({ request }) =>
    analyticsService.getAnalyticsReadModel(parseQuery(request, filterContextSchema))
  )
  .get("/digits", ({ request }) =>
    analyticsService.getDigitStats(parseQuery(request, filterContextSchema))
  )
  .get("/numbers", ({ request }) =>
    analyticsService.getNumberStats(parseQuery(request, filterContextSchema))
  );
