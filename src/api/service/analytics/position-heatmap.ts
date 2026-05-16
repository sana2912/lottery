export type PositionHeatmapCell = {
  appearanceCount: number;
  digit: string;
  missingRounds: number;
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
    const digitStats = new Map<string, { appearanceCount: number; lastSeenIndex: number | null }>();

    for (let drawIndex = 0; drawIndex < draws.length; drawIndex += 1) {
      const digitsInDraw = new Set(
        draws[drawIndex].numbers
          .map((number) => number.at(index))
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

    const cells = buildHeatmapCells(digitStats, draws.length);
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
        existing.score = round((existing.score + cell.score) / 2);
        existing.missingRounds = Math.min(existing.missingRounds, cell.missingRounds);
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
  digitStats: ReadonlyMap<string, { appearanceCount: number; lastSeenIndex: number | null }>,
  drawCount: number
) {
  const maxAppearanceCount = Math.max(
    1,
    ...Array.from(digitStats.values(), (stat) => stat.appearanceCount)
  );
  const maxMissingRounds = Math.max(
    1,
    ...Array.from(digitStats.values(), (stat) =>
      stat.lastSeenIndex === null ? drawCount : drawCount - 1 - stat.lastSeenIndex
    )
  );

  return Array.from({ length: 10 }, (_, digitIndex) => {
    const digit = String(digitIndex);
    const stat = digitStats.get(digit);
    const appearanceCount = stat?.appearanceCount ?? 0;
    const missingRounds =
      stat?.lastSeenIndex === undefined || stat.lastSeenIndex === null
        ? drawCount
        : drawCount - 1 - stat.lastSeenIndex;
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
