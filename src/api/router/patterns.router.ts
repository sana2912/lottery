import { Elysia } from "elysia";
import { patternsService } from "@/api/service/patterns.service";
import { filterContextSchema } from "@/schema/app/query.schema";
import { parseQuery } from "@/util/api/query";

export const patternsRouter = new Elysia({ prefix: "/patterns" }).get("/", ({ request }) =>
  patternsService.getPatternsReadModel(parseQuery(request, filterContextSchema))
);
