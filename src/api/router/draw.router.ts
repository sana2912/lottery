import { Elysia } from "elysia";
import { notImplemented } from "@/util/api/response";

export const drawRouter = new Elysia({ prefix: "/draws" }).get("/", notImplemented);
