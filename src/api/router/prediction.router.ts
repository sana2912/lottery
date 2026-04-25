import { Elysia } from "elysia";
import { notImplemented } from "@/util/api/response";

export const predictionRouter = new Elysia({ prefix: "/predictions" })
  .get("/", notImplemented)
  .post("/", notImplemented);
