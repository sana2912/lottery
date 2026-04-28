import { Elysia } from "elysia";
import { watchlistService } from "@/api/service/watchlist.service";
import {
  createWatchlistItemSchema,
  updateWatchlistItemSchema
} from "@/schema/app/watchlist.schema";

export const watchlistRouter = new Elysia({ prefix: "/watchlist" })
  .get("/", () => watchlistService.getWatchlist())
  .post("/", ({ body }) =>
    watchlistService.createWatchlistItem(createWatchlistItemSchema.parse(body))
  )
  .patch("/:id", ({ body, params }) =>
    watchlistService.updateWatchlistItem(params.id, updateWatchlistItemSchema.parse(body))
  )
  .delete("/:id", ({ params }) => watchlistService.deleteWatchlistItem(params.id));
