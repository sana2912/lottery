import { toApiCalendarReadModel } from "@/api/model/dto/calendar.dto";
import { resolveAnalysisSample } from "@/api/service/analysis-snapshot/sample-resolver";
import {
  getAnalysisContextForCalendarQuery,
  getAnalysisSnapshotCalendarReadModel
} from "@/api/service/analysis-snapshot/snapshot-reader";
import {
  buildCalendarHeatmapInsight,
  buildCalendarHeatmapInsightFromSnapshot
} from "@/api/service/calendar/calendar-heatmap-insight";
import { getPrisma } from "@/api/service/prisma";
import type { CalendarHeatmapQuery } from "@/schema/app/calendar.schema";

export async function getCalendarReadModel(query: CalendarHeatmapQuery = {}) {
  const prisma = getPrisma();
  const computedAt = new Date();
  const context = getAnalysisContextForCalendarQuery(query, computedAt);

  const [nextPersistedDraw, recentDraws, cachedHeatmap] = await Promise.all([
    timeAsync("calendar.next draw query", () =>
      prisma.lotteryDraw.findFirst({
        orderBy: {
          drawDate: "asc"
        },
        where: {
          drawDate: {
            gt: computedAt
          }
        }
      })
    ),
    timeAsync("calendar.recent draws query", () =>
      prisma.lotteryDraw.findMany({
        orderBy: {
          drawDate: "desc"
        },
        take: 10,
        where: {
          drawDate: {
            lte: computedAt
          }
        }
      })
    ),
    timeAsync("calendar.analysis snapshot lookup", () =>
      context ? getAnalysisSnapshotCalendarReadModel(query, computedAt) : Promise.resolve(null)
    )
  ]);

  if (context && !cachedHeatmap) {
    console.warn(
      `calendar.snapshot miss for prizeType=${query.prizeType ?? "FIRST"} scope=${query.scope ?? "MONTH"} month=${query.month ?? computedAt.getUTCMonth() + 1} year=${query.year ?? computedAt.getUTCFullYear()}; using on-demand fallback.`
    );
  }

  const nextDraw = nextPersistedDraw
    ? {
        drawDate: formatCalendarDate(nextPersistedDraw.drawDate),
        drawDateIso: nextPersistedDraw.drawDate,
        drawNo: nextPersistedDraw.drawNo ?? undefined,
        id: nextPersistedDraw.id,
        isNextDraw: true,
        status: "upcoming" as const
      }
    : buildSyntheticNextDraw(computedAt, recentDraws[0]?.drawDate);

  const monthlyInsights = await timeAsync("calendar.monthly insights build", async () => {
    if (!context) {
      return [];
    }

    if (cachedHeatmap) {
      return [buildCalendarHeatmapInsightFromSnapshot(cachedHeatmap, context, query)];
    }

    const sample = await resolveAnalysisSample(context);
    const insight = buildCalendarHeatmapInsight(context, sample);

    return insight ? [insight] : [];
  });

  return timeSync("calendar.dto mapping", () =>
    toApiCalendarReadModel({
      draws: [
        nextDraw,
        ...recentDraws.map((draw) => ({
          drawDate: formatCalendarDate(draw.drawDate),
          drawDateIso: draw.drawDate,
          drawNo: draw.drawNo ?? undefined,
          id: draw.id,
          isNextDraw: false,
          status: "past" as const
        }))
      ],
      generatedAt: computedAt,
      monthlyInsights,
      nextDraw,
      source: "api"
    })
  );
}

export const calendarService = {
  getCalendarReadModel
} as const;

function getNextDrawDate(reference: Date, latestPastDrawDate?: Date) {
  const anchor = latestPastDrawDate ?? reference;
  const utcYear = anchor.getUTCFullYear();
  const utcMonth = anchor.getUTCMonth();
  const utcDay = anchor.getUTCDate();

  if (utcDay < 16) {
    return new Date(Date.UTC(utcYear, utcMonth, 16));
  }

  return new Date(Date.UTC(utcYear, utcMonth + 1, 1));
}

function buildSyntheticNextDraw(reference: Date, latestPastDrawDate?: Date) {
  const nextDrawDate = getNextDrawDate(reference, latestPastDrawDate);

  return {
    drawDate: formatCalendarDate(nextDrawDate),
    drawDateIso: nextDrawDate,
    drawNo: buildNextDrawNumber(nextDrawDate),
    id: `upcoming-${nextDrawDate.toISOString().slice(0, 10)}`,
    isNextDraw: true,
    status: "upcoming" as const
  };
}

function buildNextDrawNumber(drawDate: Date) {
  const startOfYear = Date.UTC(drawDate.getUTCFullYear(), 0, 1);
  const current = Date.UTC(
    drawDate.getUTCFullYear(),
    drawDate.getUTCMonth(),
    drawDate.getUTCDate()
  );
  const dayOffset = Math.floor((current - startOfYear) / (1000 * 60 * 60 * 24));
  const sequence = Math.floor(dayOffset / 15) + 1;

  return `${String(sequence).padStart(2, "0")}/${drawDate.getUTCFullYear()}`;
}

function formatCalendarDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(value);
}

async function timeAsync<T>(label: string, operation: () => Promise<T>) {
  console.time(label);

  try {
    return await operation();
  } finally {
    console.timeEnd(label);
  }
}

function timeSync<T>(label: string, operation: () => T) {
  console.time(label);

  try {
    return operation();
  } finally {
    console.timeEnd(label);
  }
}
