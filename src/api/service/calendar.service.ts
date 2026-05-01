import { toApiCalendarReadModel } from "@/api/model/dto/calendar.dto";
import { getPrisma } from "@/api/service/prisma";

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

export async function getCalendarReadModel() {
  const prisma = getPrisma();
  const computedAt = new Date();
  const [nextPersistedDraw, recentDraws, monthlyDraws] = await Promise.all([
    prisma.lotteryDraw.findFirst({
      orderBy: {
        drawDate: "asc"
      },
      where: {
        drawDate: {
          gt: computedAt
        }
      }
    }),
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
    }),
    prisma.lotteryDraw.findMany({
      include: {
        prizes: true
      },
      orderBy: {
        drawDate: "desc"
      },
      take: 96,
      where: {
        drawDate: {
          lte: computedAt
        }
      }
    })
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

  return toApiCalendarReadModel({
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
    monthlyInsights: buildMonthlyInsights(monthlyDraws),
    nextDraw,
    source: "api"
  });
}

export const calendarService = {
  getCalendarReadModel
} as const;

function buildMonthlyInsights(draws: CalendarInsightDraw[]) {
  const groupedDraws = new Map<number, CalendarInsightDraw[]>();

  for (const draw of draws) {
    const month = draw.drawDate.getUTCMonth() + 1;
    const bucket = groupedDraws.get(month) ?? [];
    bucket.push(draw);
    groupedDraws.set(month, bucket);
  }

  const currentMonth = new Date().getUTCMonth() + 1;
  const preferredMonths = [currentMonth, ...groupedDraws.keys()].filter(
    (month, index, values) => values.indexOf(month) === index
  );

  return preferredMonths.slice(0, 3).flatMap((month) => {
    const monthDraws = groupedDraws.get(month);

    if (!monthDraws || monthDraws.length === 0) {
      return [];
    }

    const twoDigitNumbers = monthDraws.flatMap((draw) =>
      draw.prizes.filter((prize) => prize.type === "TWO_DIGIT").map((prize) => prize.number)
    );

    if (twoDigitNumbers.length === 0) {
      return [];
    }

    const counts = countNumbers(twoDigitNumbers);
    const orderedNumbers = [...counts.entries()].sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    });
    const oddCount = twoDigitNumbers.filter(
      (number) => Number(number.at(-1) ?? "0") % 2 === 1
    ).length;
    const evenCount = twoDigitNumbers.length - oddCount;
    const highCount = twoDigitNumbers.filter((number) => Number(number.at(-1) ?? "0") >= 5).length;
    const lowCount = twoDigitNumbers.length - highCount;
    const dominantParity = oddCount >= evenCount ? "odd-ending numbers" : "even-ending numbers";
    const dominantRange = highCount >= lowCount ? "high-ending numbers" : "low-ending numbers";

    return [
      {
        coldNumbers: orderedNumbers
          .slice(-2)
          .map(([number]) => number)
          .reverse(),
        hotNumbers: orderedNumbers.slice(0, 2).map(([number]) => number),
        id: `monthly-insight-${month}`,
        label: MONTH_LABELS[month],
        month,
        patternNotes: [
          `${dominantParity} appeared slightly more often in the sampled month.`,
          `${dominantRange} carried more weight across the same-month historical draws.`
        ],
        sampleSize: monthDraws.length,
        summary: `${MONTH_LABELS[month]} has ${monthDraws.length} historical draws in sample, leaning toward ${dominantParity} and ${dominantRange}.`
      }
    ];
  });
}

function countNumbers(numbers: readonly string[]) {
  const counts = new Map<string, number>();

  for (const number of numbers) {
    counts.set(number, (counts.get(number) ?? 0) + 1);
  }

  return counts;
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
