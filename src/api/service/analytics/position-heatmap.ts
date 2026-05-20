export type PositionHeatmapCell = {
  appearanceCount: number;
  digit: string;
  eventCount: number;
  eventRatePercent: number;
  expectedRatePercent: number;
  expectedPresenceRatePercent: number;
  lift: number;
  missingRounds: number;
  presenceRatePercent: number;
  sampleEventCount: number;
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

    const cells = assignWithinRowVisualTones(
      buildHeatmapCells(digitStats, draws.length, positionEventCount)
    );
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

export function assignWithinRowVisualTones(
  cells: readonly PositionHeatmapCell[]
): PositionHeatmapCell[] {
  const activeCells = cells.filter((cell) => cell.eventCount > 0);
  const inactiveCells = cells.filter((cell) => cell.eventCount === 0);
  const rankedActive = [...activeCells].sort(sortCellsForWithinRowTone);
  const toneByDigit = new Map<string, PositionHeatmapCell["tone"]>(
    inactiveCells.map((cell) => [cell.digit, "neutral"] as const)
  );

  for (const [rankIndex, cell] of rankedActive.entries()) {
    toneByDigit.set(cell.digit, getWithinRowTone(rankIndex, rankedActive.length));
  }

  return cells.map((cell) => ({
    ...cell,
    tone: toneByDigit.get(cell.digit) ?? "neutral"
  }));
}

export function buildOverallPositionDigitStats(rows: readonly PositionHeatmapRow[]) {
  const digitStats = new Map<string, PositionHeatmapCell>();

  for (const row of rows) {
    for (const cell of row.cells) {
      const existing = digitStats.get(cell.digit);

      if (existing) {
        existing.appearanceCount += cell.appearanceCount;
        existing.eventCount += cell.eventCount;
        existing.sampleEventCount += cell.sampleEventCount;
        existing.eventRatePercent = getPercent(existing.eventCount, existing.sampleEventCount);
        existing.expectedPresenceRatePercent = round(
          (existing.expectedPresenceRatePercent + cell.expectedPresenceRatePercent) / 2
        );
        existing.lift = getLift(existing.eventRatePercent, existing.expectedRatePercent);
        existing.score = getFrequencyEffectScore(
          existing.eventCount,
          existing.sampleEventCount,
          existing.expectedRatePercent / 100
        );
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
    right.eventRatePercent - left.eventRatePercent ||
    right.eventCount - left.eventCount ||
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
    const score = getFrequencyEffectScore(eventCount, positionEventCount, expectedDigitRate);

    return {
      appearanceCount,
      digit,
      eventCount,
      eventRatePercent: round(eventRate * 100),
      expectedRatePercent: round(expectedDigitRate * 100),
      expectedPresenceRatePercent: round(expectedPresenceRate * 100),
      lift: round(lift),
      missingRounds,
      presenceRatePercent: round(presenceRate * 100),
      sampleEventCount: positionEventCount,
      score,
      tone: "neutral" as const
    };
  });
}

function sortCellsForWithinRowTone(left: PositionHeatmapCell, right: PositionHeatmapCell) {
  return (
    right.eventRatePercent - left.eventRatePercent ||
    right.score - left.score ||
    right.eventCount - left.eventCount ||
    left.digit.localeCompare(right.digit)
  );
}

function getWithinRowTone(rankIndex: number, total: number): PositionHeatmapCell["tone"] {
  if (total <= 1) {
    return "neutral";
  }

  const hotCount = Math.max(1, Math.round(total * 0.2));
  const warmCount = Math.max(1, Math.round(total * 0.2));
  const coolCount = Math.max(1, Math.round(total * 0.2));
  const coldCount = Math.max(1, Math.round(total * 0.2));
  const warmEnd = hotCount + warmCount;
  const coldStart = total - coldCount;
  const coolStart = coldStart - coolCount;

  if (rankIndex < hotCount) {
    return "hot";
  }

  if (rankIndex < warmEnd) {
    return "warm";
  }

  if (rankIndex >= coldStart) {
    return "cold";
  }

  if (rankIndex >= coolStart) {
    return "cool";
  }

  return "neutral";
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function getRate(value: number, total: number) {
  return total > 0 ? value / total : 0;
}

function getPercent(value: number, total: number) {
  return round(getRate(value, total) * 100);
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, round(value)));
}

function getLift(observedPercent: number, expectedPercent: number) {
  return expectedPercent > 0 ? round(observedPercent / expectedPercent) : 0;
}

function getFrequencyEffectScore(eventCount: number, sampleSize: number, expectedRate: number) {
  if (sampleSize <= 0) {
    return 0;
  }

  if (expectedRate <= 0) {
    return 50;
  }

  const observedRate = eventCount / sampleSize;
  const relativeMove = (observedRate - expectedRate) / expectedRate;

  return clamp(50 + relativeMove * 100);
}
