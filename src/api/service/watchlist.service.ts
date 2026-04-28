import { toApiWatchlistItem, toApiWatchlistReadModel } from "@/api/model/dto/watchlist.dto";
import { getPrisma } from "@/api/service/prisma";
import type { ApiDeleteWatchlistItemResponse } from "@/schema/api/watchlist";
import type { CreateWatchlistItem, UpdateWatchlistItem } from "@/schema/app/watchlist.schema";

export async function getWatchlist() {
  const prisma = getPrisma();
  const items = await prisma.userWatchlistItem.findMany({
    orderBy: {
      updatedAt: "desc"
    }
  });

  return toApiWatchlistReadModel(items);
}

export async function createWatchlistItem(input: CreateWatchlistItem) {
  const prisma = getPrisma();
  const item = await prisma.userWatchlistItem.create({
    data: {
      note: input.note,
      number: input.number,
      source: input.source,
      tags: input.tags
    }
  });

  return toApiWatchlistItem(item);
}

export async function updateWatchlistItem(id: string, input: UpdateWatchlistItem) {
  const prisma = getPrisma();
  const item = await prisma.userWatchlistItem.update({
    data: {
      note: input.note,
      source: input.source,
      tags: input.tags
    },
    where: {
      id
    }
  });

  return toApiWatchlistItem(item);
}

export async function deleteWatchlistItem(id: string): Promise<ApiDeleteWatchlistItemResponse> {
  const prisma = getPrisma();
  await prisma.userWatchlistItem.delete({
    where: {
      id
    }
  });

  return {
    deleted: true,
    id,
    scope: "global" as const
  };
}

export const watchlistService = {
  createWatchlistItem,
  deleteWatchlistItem,
  getWatchlist,
  updateWatchlistItem
} as const;
