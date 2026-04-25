import { Elysia } from "elysia";
import { notImplemented } from "@/util/api/response";

export const analyticsRouter = new Elysia({ prefix: "/analytics" }).get("/", notImplemented);
