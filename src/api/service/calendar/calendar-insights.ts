import type {
  PositionHeatmapCell,
  PositionHeatmapRow
} from "@/api/service/analytics/position-heatmap";

export type PositionNumberStat = {
  appearanceCount: number;
  digit: string;
  missingRounds: number;
};

export function mapHeatmapRowsToPositionInsights(rows: readonly PositionHeatmapRow[]) {
  return rows.map((row) => ({
    coldNumbers: row.coldDigits
      .map((digit) => toPositionNumberStat(getCellForDigit(row, digit)))
      .flatMap((cell) => (cell ? [cell] : [])),
    hotNumbers: row.hotDigits
      .map((digit) => toPositionNumberStat(getCellForDigit(row, digit)))
      .flatMap((cell) => (cell ? [cell] : [])),
    position: row.position
  }));
}

function getCellForDigit(row: PositionHeatmapRow, digit: string) {
  return row.cells.find((cell) => cell.digit === digit);
}

function toPositionNumberStat(cell: PositionHeatmapCell | undefined): PositionNumberStat | null {
  if (!cell) {
    return null;
  }

  return {
    appearanceCount: cell.appearanceCount,
    digit: cell.digit,
    missingRounds: cell.missingRounds
  };
}
