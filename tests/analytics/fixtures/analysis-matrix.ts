import type { AnalysisPrizeType } from "@/api/service/analysis-snapshot/analysis-context";
import { getAnalysisPrizeNumberLength } from "@/api/service/analysis-snapshot/analysis-context";
import {
  getPrizeTypesForSampleQuery,
  matchesAnalysisPrizeSample
} from "@/api/service/analysis-snapshot/prize-sample-types";
import type { PrizeLike } from "@/api/service/analytics/digit-events";
import { extractDigitEvents } from "@/api/service/analytics/digit-events";
import { calculateDigitStats, calculateNumberStats } from "@/api/service/analytics/number-stats";
import { buildPositionHeatmapRows } from "@/api/service/analytics/position-heatmap";

export type MatrixPrizeType =
  | "FIRST"
  | "NEAR_FIRST"
  | "TWO_DIGIT"
  | "THREE_DIGIT"
  | "PRIZE2"
  | "PRIZE3"
  | "PRIZE4"
  | "PRIZE5"
  | "SIX_DIGIT_ALL";

export type MatrixScope = "ALL_TIME" | "MONTH";

const ROWS_PER_DRAW: Record<MatrixPrizeType, number> = {
  FIRST: 1,
  NEAR_FIRST: 2,
  TWO_DIGIT: 1,
  THREE_DIGIT: 2,
  PRIZE2: 5,
  PRIZE3: 10,
  PRIZE4: 50,
  PRIZE5: 100,
  SIX_DIGIT_ALL: 168
};

const SIX_DIGIT_SOURCES = ["FIRST", "NEAR_FIRST", "PRIZE2", "PRIZE3", "PRIZE4", "PRIZE5"] as const;

export function buildSyntheticDraws({
  drawCount,
  month,
  prizeType
}: {
  drawCount: number;
  month?: number;
  prizeType: MatrixPrizeType;
}) {
  const draws: Array<{
    drawDate: Date;
    prizes: Array<{
      draw: { drawDate: Date; lotteryType: string };
      number: string;
      position: number | null;
      type: string;
    }>;
  }> = [];

  for (let drawIndex = 0; drawIndex < drawCount; drawIndex += 1) {
    const drawDate = new Date(Date.UTC(2026, (month ?? 1) - 1, 1 + drawIndex));
    const prizes = buildPrizesForDraw(prizeType, drawDate, drawIndex);

    draws.push({ drawDate, prizes });
  }

  return draws;
}

export function selectMatrixSampleDraws(
  draws: ReturnType<typeof buildSyntheticDraws>,
  prizeType: MatrixPrizeType,
  scope: MatrixScope,
  month?: number,
  year = 2026
) {
  const matching = draws.filter((draw) => {
    if (scope === "MONTH") {
      if (draw.drawDate.getUTCMonth() + 1 !== month) {
        return false;
      }

      if (draw.drawDate.getUTCFullYear() !== year) {
        return false;
      }
    }

    return draw.prizes.some((prize) =>
      matchesAnalysisPrizeSample(
        { position: prize.position, type: prize.type },
        { prizeType: prizeType as AnalysisPrizeType }
      )
    );
  });
  return [...matching].sort((left, right) => left.drawDate.getTime() - right.drawDate.getTime());
}

export function flattenValidPrizes(
  draws: ReturnType<typeof selectMatrixSampleDraws>,
  prizeType: MatrixPrizeType
) {
  const numberLength = getAnalysisPrizeNumberLength(prizeType as AnalysisPrizeType);

  return draws.flatMap((draw) =>
    draw.prizes
      .filter((prize) =>
        matchesAnalysisPrizeSample(
          { position: prize.position, type: prize.type },
          { prizeType: prizeType as AnalysisPrizeType }
        )
      )
      .filter((prize) => prize.number.length === numberLength)
      .map((prize) => ({
        ...prize,
        type: prizeType
      }))
  );
}

export function assertNumberStatsDenominator(
  prizes: readonly PrizeLike[],
  drawCount: number,
  numberLength?: number
) {
  const stats = calculateNumberStats(
    prizes,
    { computedAt: new Date("2026-05-01T00:00:00.000Z"), drawCount, windowSize: drawCount },
    numberLength
  );
  const samplePrizeCount = prizes.length;

  for (const stat of stats) {
    const expected = samplePrizeCount > 0 ? round((stat.hitCount / samplePrizeCount) * 100) : 0;

    if (stat.frequencyPercent !== expected) {
      throw new Error(
        `frequencyPercent ${stat.frequencyPercent} expected ${expected} for number ${stat.number}`
      );
    }

    if (stat.samplePrizeCount !== samplePrizeCount) {
      throw new Error(
        `samplePrizeCount ${stat.samplePrizeCount} expected ${samplePrizeCount} for number ${stat.number}`
      );
    }
  }
}

export function assertDigitStatsDenominator(prizes: readonly PrizeLike[], drawCount: number) {
  const events = extractDigitEvents(prizes);
  const stats = calculateDigitStats(events, {
    computedAt: new Date("2026-05-01T00:00:00.000Z"),
    drawCount,
    windowSize: drawCount
  });
  const sampleByPosition = new Map<number, number>();

  for (const event of events) {
    const position = event.position ?? 0;

    sampleByPosition.set(position, (sampleByPosition.get(position) ?? 0) + 1);
  }

  for (const stat of stats) {
    const position = stat.position ?? 0;
    const sampleEventCount = sampleByPosition.get(position) ?? 0;
    const expected = sampleEventCount > 0 ? round((stat.hitCount / sampleEventCount) * 100) : 0;

    if (stat.sampleEventCount !== sampleEventCount) {
      throw new Error(
        `sampleEventCount ${stat.sampleEventCount} expected ${sampleEventCount} at position ${position}`
      );
    }

    if (stat.frequencyPercent !== expected) {
      throw new Error(
        `digit frequency ${stat.frequencyPercent} expected ${expected} for ${stat.digit}@${position}`
      );
    }
  }
}

export function assertHeatmapEventInvariant(
  draws: ReturnType<typeof selectMatrixSampleDraws>,
  prizeType: MatrixPrizeType
) {
  const numberLength = getAnalysisPrizeNumberLength(prizeType as AnalysisPrizeType);
  const prizes = flattenValidPrizes(draws, prizeType);
  const rows = buildPositionHeatmapRows(
    draws.map((draw) => ({
      drawDate: draw.drawDate,
      numbers: prizes
        .filter((prize) => prize.draw.drawDate.getTime() === draw.drawDate.getTime())
        .map((prize) => prize.number)
    })),
    numberLength
  );

  for (const row of rows) {
    const eventCountSum = row.cells.reduce((total, cell) => total + cell.eventCount, 0);
    const sampleEventCount = row.cells[0]?.sampleEventCount ?? 0;

    if (eventCountSum !== sampleEventCount) {
      throw new Error(
        `heatmap position ${row.position}: eventCountSum ${eventCountSum} != sampleEventCount ${sampleEventCount}`
      );
    }
  }
}

export function getExpectedRowsPerDraw(prizeType: MatrixPrizeType) {
  return ROWS_PER_DRAW[prizeType];
}

export function getSourceTypesForMatrix(prizeType: MatrixPrizeType) {
  return getPrizeTypesForSampleQuery(prizeType as AnalysisPrizeType);
}

function buildPrizesForDraw(prizeType: MatrixPrizeType, drawDate: Date, drawIndex: number) {
  if (prizeType === "SIX_DIGIT_ALL") {
    return SIX_DIGIT_SOURCES.flatMap((sourceType) =>
      Array.from({ length: ROWS_PER_DRAW[sourceType as MatrixPrizeType] }, (_, rowIndex) =>
        prizeRow({
          drawDate,
          number: numberFor(sourceType, drawIndex, rowIndex, 6),
          position: rowIndex + 1,
          type: sourceType
        })
      )
    );
  }

  const rows = ROWS_PER_DRAW[prizeType];
  const length = getAnalysisPrizeNumberLength(prizeType as AnalysisPrizeType);

  return Array.from({ length: rows }, (_, rowIndex) =>
    prizeRow({
      drawDate,
      number: numberFor(prizeType, drawIndex, rowIndex, length),
      position: prizeType === "THREE_DIGIT" ? rowIndex + 1 : rowIndex + 1,
      type: prizeType
    })
  );
}

function prizeRow({
  drawDate,
  number,
  position,
  type
}: {
  drawDate: Date;
  number: string;
  position: number;
  type: string;
}) {
  return {
    draw: {
      drawDate,
      lotteryType: "THAI_GOVERNMENT"
    },
    number,
    position,
    type
  };
}

function numberFor(prizeType: string, drawIndex: number, rowIndex: number, length: number) {
  const seed = `${prizeType}-${drawIndex}-${rowIndex}`;

  return seed.replace(/\D/g, "").padEnd(length, "0").slice(0, length);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
