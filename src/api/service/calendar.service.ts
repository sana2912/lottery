import { toApiCalendarReadModel } from "@/api/model/dto/calendar.dto";
import type { AnalysisCalendarHeatmapReadModel } from "@/api/service/analysis-snapshot/calendar-heatmap-read-model";
import { getAnalysisSnapshotCalendarReadModel } from "@/api/service/analysis-snapshot/snapshot-reader";
import {
  buildOverallPositionDigitStats,
  buildPositionHeatmapRows,
  type PositionHeatmapCell,
  type PositionHeatmapRow,
  sortPositionHeatmapCells
} from "@/api/service/analytics/position-heatmap";
import { getPrisma } from "@/api/service/prisma";
import type { CalendarHeatmapQuery } from "@/schema/app/calendar.schema";

const MONTH_LABELS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

type CalendarInsightDraw = {
  drawDate: Date;
  prizes: Array<{ number: string; type: string }>;
};

type PositionNumberStat = {
  appearanceCount: number;
  digit: string;
  missingRounds: number;
};

type HeatmapCell = PositionHeatmapCell;
type HeatmapRow = PositionHeatmapRow;

const DEFAULT_ANALYSIS_WINDOW_PRESET = "50";
export async function getCalendarReadModel(query: CalendarHeatmapQuery = {}) {
  const prisma = getPrisma();
  const computedAt = new Date();
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
      getAnalysisSnapshotCalendarReadModel(query, computedAt)
    )
  ]);
  const heatmapDraws = cachedHeatmap
    ? []
    : await timeAsync("calendar.heatmap draws query", () =>
        prisma.lotteryDraw.findMany({
          include: {
            prizes: {
              where: query.prizeType
                ? {
                    type: query.prizeType
                  }
                : undefined
            }
          },
          orderBy: {
            drawDate: "desc"
          },
          take: getCalendarDrawQueryLimit(query),
          where: {
            drawDate: {
              lte: computedAt
            }
          }
        })
      );

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
      monthlyInsights: timeSync("calendar.monthly insights build", () =>
        cachedHeatmap
          ? [buildMonthlyInsightFromSnapshot(cachedHeatmap, query, computedAt)]
          : buildMonthlyInsights(heatmapDraws, query)
      ),
      nextDraw,
      source: "api"
    })
  );
}

export const calendarService = {
  getCalendarReadModel
} as const;

function buildMonthlyInsights(draws: CalendarInsightDraw[], query: CalendarHeatmapQuery) {
  const selectedScope = query.scope ?? "MONTH";
  const selectedMonth =
    selectedScope === "MONTH" ? (query.month ?? new Date().getUTCMonth() + 1) : undefined;
  const selectedPrizeType = query.prizeType ?? "FIRST";
  const selectedWindowPreset = getCalendarWindowPreset(query);
  const selectedWindowSize = getCalendarWindowLimit(query) ?? draws.length;
  const matchingDraws = draws
    .filter((draw) => draw.prizes.length > 0)
    .filter(
      (draw) => selectedScope === "ALL_TIME" || draw.drawDate.getUTCMonth() + 1 === selectedMonth
    )
    .slice(0, selectedWindowSize)
    .reverse();

  if (matchingDraws.length === 0) {
    return [];
  }

  const heatmapRows = buildPositionHeatmapRows(
    matchingDraws.map((draw) => ({
      drawDate: draw.drawDate,
      numbers: draw.prizes.map((prize) => prize.number)
    })),
    getPrizeNumberLength(selectedPrizeType)
  );
  const overallDigitStats = buildOverallPositionDigitStats(heatmapRows);
  const rankedDigits = [...overallDigitStats.values()].sort(sortPositionHeatmapCells);
  const hotNumbers = rankedDigits.slice(0, 2).map((cell) => cell.digit);
  const coldNumbers = [...rankedDigits]
    .reverse()
    .slice(0, 2)
    .map((cell) => cell.digit);

  return [
    {
      coldNumbers,
      heatmapRows,
      hotNumbers,
      id: `monthly-insight-${selectedScope}-${selectedMonth ?? "all"}-${selectedPrizeType}-${selectedWindowPreset}`,
      label:
        selectedScope === "MONTH" && selectedMonth ? MONTH_LABELS[selectedMonth] : "All months",
      month: selectedMonth,
      patternNotes: [
        "Heatmap scores combine frequency and recency for each digit position.",
        `Each row represents positions for ${selectedPrizeType}.`
      ],
      positionInsights: heatmapRows.map((row) => ({
        coldNumbers: row.coldDigits
          .map((digit) => toPositionNumberStat(getCellForDigit(row, digit)))
          .flatMap((cell) => (cell ? [cell] : [])),
        hotNumbers: row.hotDigits
          .map((digit) => toPositionNumberStat(getCellForDigit(row, digit)))
          .flatMap((cell) => (cell ? [cell] : [])),
        position: row.position
      })),
      prizeType: selectedPrizeType,
      sampleSize: matchingDraws.length,
      scope: selectedScope,
      summary:
        selectedScope === "MONTH" && selectedMonth
          ? `${MONTH_LABELS[selectedMonth]} heatmap uses ${matchingDraws.length} matching draws for ${selectedPrizeType}.`
          : `All-month heatmap uses ${matchingDraws.length} matching draws for ${selectedPrizeType}.`,
      windowPreset: selectedWindowPreset,
      windowSize: selectedWindowSize
    }
  ];
}

function buildMonthlyInsightFromSnapshot(
  snapshot: AnalysisCalendarHeatmapReadModel,
  query: CalendarHeatmapQuery,
  computedAt: Date
) {
  const selectedMonth = query.month ?? computedAt.getUTCMonth() + 1;
  const selectedPrizeType = query.prizeType ?? "FIRST";
  const selectedScope = query.scope ?? snapshot.scope;
  const selectedWindowPreset = getCalendarWindowPreset(query);
  const selectedWindowSize = getCalendarWindowLimit(query) ?? snapshot.sampleSize;
  const heatmapRows = snapshot.heatmapRows;
  const overallDigitStats = buildOverallPositionDigitStats(heatmapRows);
  const rankedDigits = [...overallDigitStats.values()].sort(sortPositionHeatmapCells);
  const hotNumbers = rankedDigits.slice(0, 2).map((cell) => cell.digit);
  const coldNumbers = [...rankedDigits]
    .reverse()
    .slice(0, 2)
    .map((cell) => cell.digit);

  return {
    coldNumbers,
    heatmapRows,
    hotNumbers,
    id: `monthly-insight-${selectedScope}-${selectedMonth}-${selectedPrizeType}-${selectedWindowPreset}`,
    label: selectedScope === "MONTH" ? MONTH_LABELS[selectedMonth] : "All months",
    month: selectedScope === "MONTH" ? selectedMonth : undefined,
    patternNotes: [
      "Heatmap scores combine frequency and recency for each digit position.",
      "This insight is served from a precomputed analysis snapshot."
    ],
    positionInsights: heatmapRows.map((row) => ({
      coldNumbers: row.coldDigits
        .map((digit) => toPositionNumberStat(getCellForDigit(row, digit)))
        .flatMap((cell) => (cell ? [cell] : [])),
      hotNumbers: row.hotDigits
        .map((digit) => toPositionNumberStat(getCellForDigit(row, digit)))
        .flatMap((cell) => (cell ? [cell] : [])),
      position: row.position
    })),
    prizeType: selectedPrizeType,
    sampleSize: snapshot.sampleSize,
    scope: selectedScope,
    summary: snapshot.summary,
    windowPreset: selectedWindowPreset,
    windowSize: selectedWindowSize
  };
}

function getCalendarWindowPreset(query: CalendarHeatmapQuery) {
  if (query.windowPreset) {
    return query.windowPreset;
  }

  if (query.windowSize === 50 || query.windowSize === 100 || query.windowSize === 500) {
    return String(query.windowSize) as "50" | "100" | "500";
  }

  return DEFAULT_ANALYSIS_WINDOW_PRESET;
}

function getCalendarWindowLimit(query: CalendarHeatmapQuery) {
  const windowPreset = getCalendarWindowPreset(query);

  return windowPreset === "ALL" ? undefined : Number(windowPreset);
}

function getCalendarDrawQueryLimit(query: CalendarHeatmapQuery) {
  const windowLimit = getCalendarWindowLimit(query) ?? 500;

  return Math.min(Math.max(windowLimit * 20, 240), 2000);
}

function getPrizeNumberLength(prizeType: NonNullable<CalendarHeatmapQuery["prizeType"]>) {
  switch (prizeType) {
    case "TWO_DIGIT":
      return 2;
    case "THREE_DIGIT":
    case "THREE_FRONT":
    case "THREE_BACK":
      return 3;
    default:
      return 6;
  }
}

function getCellForDigit(row: HeatmapRow, digit: string) {
  return row.cells.find((cell) => cell.digit === digit);
}

function toPositionNumberStat(cell: HeatmapCell | undefined): PositionNumberStat | null {
  if (!cell) {
    return null;
  }

  return {
    appearanceCount: cell.appearanceCount,
    digit: cell.digit,
    missingRounds: cell.missingRounds
  };
}

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
