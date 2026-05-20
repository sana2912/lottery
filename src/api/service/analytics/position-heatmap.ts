export type PositionHeatmapCell = {
  appearanceCount: number;
  digit: string;
  eventCount: number;
  eventRatePercent: number;
  expectedPresenceRatePercent: number;
  lift: number;
  missingRounds: number;
  presenceRatePercent: number;
  score: number;
  tone: "cold" | "cool" | "hot" | "neutral" | "warm";
};

export type PositionHeatmapRow = {
  cells: PositionHeatmapCell[];
  coldDigits: string[];
  hotDigits: string[];
  position: number;
};

export type PositionHeatmapDraw = {
  drawDate: Date;
  numbers: readonly string[];
};

export function buildPositionHeatmapRows(
  draws: readonly PositionHeatmapDraw[],
  numberLength: number
): PositionHeatmapRow[] {
  return Array.from({ length: numberLength }, (_, index) => {
    const digitStats = new Map<
      string,
      { appearanceCount: number; eventCount: number; lastSeenIndex: number | null }
    >();
    let positionEventCount = 0;

    for (let drawIndex = 0; drawIndex < draws.length; drawIndex += 1) {
      const digitsInDraw = new Set<string>();

      for (const number of draws[drawIndex].numbers) {
        const digit = number.at(index);

        if (!digit) {
          continue;
        }

        positionEventCount += 1;
        digitsInDraw.add(digit);

        const existing = digitStats.get(digit);

        if (existing) {
          existing.eventCount += 1;
        } else {
          digitStats.set(digit, {
            appearanceCount: 0,
            eventCount: 1,
            lastSeenIndex: null
          });
        }
      }

      for (const digit of digitsInDraw) {
        const existing = digitStats.get(digit);

        if (existing) {
          existing.appearanceCount += 1;
          existing.lastSeenIndex = drawIndex;
        } else {
          digitStats.set(digit, { appearanceCount: 1, eventCount: 0, lastSeenIndex: drawIndex });
        }
      }
    }

    const cells = buildHeatmapCells(digitStats, draws.length, positionEventCount);
    const rankedCells = [...cells].sort(sortPositionHeatmapCells);

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

export function buildOverallPositionDigitStats(rows: readonly PositionHeatmapRow[]) {
  const digitStats = new Map<string, PositionHeatmapCell>();

  for (const row of rows) {
    for (const cell of row.cells) {
      const existing = digitStats.get(cell.digit);

      if (existing) {
        existing.appearanceCount += cell.appearanceCount;
        existing.eventCount += cell.eventCount;
        existing.eventRatePercent = round((existing.eventRatePercent + cell.eventRatePercent) / 2);
        existing.expectedPresenceRatePercent = round(
          (existing.expectedPresenceRatePercent + cell.expectedPresenceRatePercent) / 2
        );
        existing.lift = round((existing.lift + cell.lift) / 2);
        existing.score = round((existing.score + cell.score) / 2);
        existing.missingRounds = Math.min(existing.missingRounds, cell.missingRounds);
        existing.presenceRatePercent = round(
          (existing.presenceRatePercent + cell.presenceRatePercent) / 2
        );
      } else {
        digitStats.set(cell.digit, { ...cell });
      }
    }
  }

  return digitStats;
}

export function sortPositionHeatmapCells(left: PositionHeatmapCell, right: PositionHeatmapCell) {
  return (
    right.score - left.score ||
    right.appearanceCount - left.appearanceCount ||
    left.missingRounds - right.missingRounds ||
    left.digit.localeCompare(right.digit)
  );
}

function buildHeatmapCells(
  digitStats: ReadonlyMap<
    string,
    { appearanceCount: number; eventCount: number; lastSeenIndex: number | null }
  >,
  drawCount: number,
  positionEventCount: number
) {
  const expectedDigitRate = 0.1;
  const averageRowsPerDraw = drawCount > 0 ? positionEventCount / drawCount : 0;
  const expectedPresenceRate = 1 - (1 - expectedDigitRate) ** averageRowsPerDraw;

  return Array.from({ length: 10 }, (_, digitIndex) => {
    const digit = String(digitIndex);
    const stat = digitStats.get(digit);
    const appearanceCount = stat?.appearanceCount ?? 0;
    const eventCount = stat?.eventCount ?? 0;
    const missingRounds =
      stat?.lastSeenIndex === undefined || stat.lastSeenIndex === null
        ? drawCount
        : drawCount - 1 - stat.lastSeenIndex;
    const eventRate = getRate(eventCount, positionEventCount);
    const presenceRate = getRate(appearanceCount, drawCount);
    const lift = expectedDigitRate > 0 ? eventRate / expectedDigitRate : 0;
    const score = getFrequencySignalScore(eventCount, positionEventCount, expectedDigitRate);

    return {
      appearanceCount,
      digit,
      eventCount,
      eventRatePercent: round(eventRate * 100),
      expectedPresenceRatePercent: round(expectedPresenceRate * 100),
      lift: round(lift),
      missingRounds,
      presenceRatePercent: round(presenceRate * 100),
      score,
      tone: getHeatmapTone(score)
    };
  });
}

function getHeatmapTone(score: number): PositionHeatmapCell["tone"] {
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

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function getRate(value: number, total: number) {
  return total > 0 ? value / total : 0;
}

function getFrequencySignalScore(eventCount: number, sampleSize: number, expectedRate: number) {
  if (sampleSize <= 0) {
    return 0;
  }

  const variance = sampleSize * expectedRate * (1 - expectedRate);

  if (variance <= 0) {
    return 50;
  }

  const expectedCount = sampleSize * expectedRate;
  const zScore = (eventCount - expectedCount) / Math.sqrt(variance);

  return round(normalCdf(zScore) * 100);
}

function normalCdf(value: number) {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function erf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);

  return sign * y;
}
