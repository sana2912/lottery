import { toApiCalendarReadModel } from "@/api/model/dto/calendar.dto";
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

type HeatmapCell = {
  appearanceCount: number;
  digit: string;
  missingRounds: number;
  score: number;
  tone: "hot" | "warm" | "neutral" | "cool" | "cold";
};

type HeatmapRow = {
  cells: HeatmapCell[];
  coldDigits: string[];
  hotDigits: string[];
  position: number;
};

const DEFAULT_CALENDAR_WINDOW_SIZE = 24;
export async function getCalendarReadModel(query: CalendarHeatmapQuery = {}) {
  const prisma = getPrisma();
  const computedAt = new Date();
  const [nextPersistedDraw, recentDraws, heatmapDraws] = await Promise.all([
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
    timeAsync("calendar.heatmap draws query", () =>
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
        take: Math.min(
          Math.max((query.windowSize ?? DEFAULT_CALENDAR_WINDOW_SIZE) * 20, 240),
          2000
        ),
        where: {
          drawDate: {
            lte: computedAt
          }
        }
      })
    )
  ]);

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
        buildMonthlyInsights(heatmapDraws, query)
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
  const selectedMonth = query.month ?? new Date().getUTCMonth() + 1;
  const selectedPrizeType = query.prizeType ?? "FIRST";
  const selectedWindowSize = query.windowSize ?? DEFAULT_CALENDAR_WINDOW_SIZE;
  const monthDraws = draws
    .filter((draw) => draw.prizes.length > 0)
    .filter((draw) => draw.drawDate.getUTCMonth() + 1 === selectedMonth)
    .slice(0, selectedWindowSize)
    .reverse();

  if (monthDraws.length === 0) {
    return [];
  }

  const heatmapRows = buildHeatmapRows(monthDraws);
  const overallDigitStats = buildOverallDigitStats(heatmapRows);
  const rankedDigits = [...overallDigitStats.values()].sort(sortDigitHeatmapCells);
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
      id: `monthly-insight-${selectedMonth}-${selectedPrizeType}-${selectedWindowSize}`,
      label: MONTH_LABELS[selectedMonth],
      month: selectedMonth,
      patternNotes: [
        "Heatmap scores combine frequency and recency for each digit position.",
        "Each row represents positions 1 to 6 for the selected prize type."
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
      sampleSize: monthDraws.length,
      summary: `${MONTH_LABELS[selectedMonth]} heatmap uses the latest ${monthDraws.length} matching draws for ${selectedPrizeType}.`,
      windowSize: selectedWindowSize
    }
  ];
}

function buildHeatmapRows(draws: readonly CalendarInsightDraw[]): HeatmapRow[] {
  return Array.from({ length: 6 }, (_, index) => {
    const digitStats = new Map<string, { appearanceCount: number; lastSeenIndex: number | null }>();

    for (let drawIndex = 0; drawIndex < draws.length; drawIndex += 1) {
      const draw = draws[drawIndex];
      const digitsInDraw = new Set(
        draw.prizes
          .map((prize) => prize.number.at(index))
          .flatMap((digit) => (digit ? [digit] : []))
      );

      for (const digit of digitsInDraw) {
        const existing = digitStats.get(digit);

        if (existing) {
          existing.appearanceCount += 1;
          existing.lastSeenIndex = drawIndex;
        } else {
          digitStats.set(digit, { appearanceCount: 1, lastSeenIndex: drawIndex });
        }
      }
    }

    const maxAppearanceCount = Math.max(
      1,
      ...Array.from(digitStats.values(), (stat) => stat.appearanceCount)
    );
    const maxMissingRounds = Math.max(
      1,
      ...Array.from(digitStats.values(), (stat) =>
        stat.lastSeenIndex === null ? draws.length : draws.length - 1 - stat.lastSeenIndex
      )
    );

    const cells = Array.from({ length: 10 }, (_, digitIndex) => {
      const digit = String(digitIndex);
      const stat = digitStats.get(digit);
      const appearanceCount = stat?.appearanceCount ?? 0;
      const missingRounds =
        stat?.lastSeenIndex === undefined || stat.lastSeenIndex === null
          ? draws.length
          : draws.length - 1 - stat.lastSeenIndex;
      const frequencyScore = appearanceCount / maxAppearanceCount;
      const recencyScore = 1 - missingRounds / maxMissingRounds;
      const score = round((frequencyScore * 0.7 + recencyScore * 0.3) * 100);

      return {
        appearanceCount,
        digit,
        missingRounds,
        score,
        tone: getHeatmapTone(score)
      };
    });

    const rankedCells = [...cells].sort(sortDigitHeatmapCells);

    return {
      cells,
      coldDigits: rankedCells
        .slice(-2)
        .map((cell) => cell.digit)
        .reverse(),
      hotDigits: rankedCells.slice(0, 2).map((cell) => cell.digit),
      position: index + 1
    };
  });
}

function buildOverallDigitStats(rows: readonly HeatmapRow[]) {
  const digitStats = new Map<string, HeatmapCell>();

  for (const row of rows) {
    for (const cell of row.cells) {
      const existing = digitStats.get(cell.digit);

      if (existing) {
        existing.appearanceCount += cell.appearanceCount;
        existing.score = round((existing.score + cell.score) / 2);
        existing.missingRounds = Math.min(existing.missingRounds, cell.missingRounds);
      } else {
        digitStats.set(cell.digit, { ...cell });
      }
    }
  }

  return digitStats;
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

function getHeatmapTone(score: number): HeatmapCell["tone"] {
  if (score >= 80) {
    return "hot";
  }

  if (score >= 65) {
    return "warm";
  }

  if (score >= 45) {
    return "neutral";
  }

  if (score >= 30) {
    return "cool";
  }

  return "cold";
}

function sortDigitHeatmapCells(left: HeatmapCell, right: HeatmapCell) {
  return (
    right.score - left.score ||
    right.appearanceCount - left.appearanceCount ||
    left.missingRounds - right.missingRounds ||
    left.digit.localeCompare(right.digit)
  );
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

function round(value: number) {
  return Math.round(value * 100) / 100;
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
