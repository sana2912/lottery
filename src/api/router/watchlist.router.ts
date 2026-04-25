import { Elysia } from "elysia";
import { notImplemented } from "@/util/api/response";

export const watchlistRouter = new Elysia({ prefix: "/watchlist" })
  .get("/", notImplemented)
  .post("/", notImplemented);
