import { Elysia } from "elysia";
import { searchService } from "@/api/service/search.service";
import { searchQuerySchema } from "@/schema/app/query.schema";
import { apiQuery } from "@/util/api/query";

export const searchRouter = new Elysia({ prefix: "/search" }).get("/", ({ request }) =>
  searchService.search(apiQuery.parseQuery(request, searchQuerySchema))
);
