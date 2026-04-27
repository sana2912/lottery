import { Elysia } from "elysia";
import { drawService } from "@/api/service/draw.service";
import { searchQuerySchema } from "@/schema/app/query.schema";
import { parseQuery } from "@/util/api/query";

export const drawRouter = new Elysia({ prefix: "/draws" })
  .get("/", ({ request }) => drawService.getDraws(parseQuery(request, searchQuerySchema)))
  .get("/:id", async ({ params, set }) => {
    const response = await drawService.getDrawById(params.id);

    if (!response) {
      set.status = 404;

      return {
        error: "Not found",
        message: "Draw not found"
      };
    }

    return response;
  });
