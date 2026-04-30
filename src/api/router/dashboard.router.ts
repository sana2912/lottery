import { Elysia } from "elysia";
import { dashboardService } from "@/api/service/dashboard.service";

export const dashboardRouter = new Elysia({ prefix: "/dashboard" }).get("/", () =>
  dashboardService.getDashboardReadModel()
);
