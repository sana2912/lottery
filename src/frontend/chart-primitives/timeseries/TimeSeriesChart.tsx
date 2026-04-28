import { ChartFrame } from "@/frontend/chart-primitives/d3/ChartFrame";

export type TimeSeriesPoint = {
  id: string;
  label: string;
  value: number;
};

export type TimeSeriesChartProps = {
  points: readonly TimeSeriesPoint[];
  title?: string;
};

export function TimeSeriesChart({ points, title = "Time series" }: TimeSeriesChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <ChartFrame title={title}>
      <div
        aria-label={title}
        className="flex h-44 items-end gap-2 border-l border-b border-[var(--color-border-soft)] px-4 pt-4"
        role="img"
      >
        {points.map((point) => (
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.id}>
            <div
              aria-hidden="true"
              className="min-h-4 w-full bg-[var(--color-brand)]"
              style={{ height: `${Math.max(8, (point.value / maxValue) * 100)}%` }}
            />
            <span className="max-w-full truncate text-[10px] text-[var(--color-text-muted)]">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}
