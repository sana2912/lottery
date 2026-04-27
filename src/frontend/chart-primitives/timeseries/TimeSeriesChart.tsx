import { ChartFrame } from "@/frontend/chart-primitives/d3/ChartFrame";

const timeSeriesPoints = [
  { id: "point-1", value: 32 },
  { id: "point-2", value: 52 },
  { id: "point-3", value: 44 },
  { id: "point-4", value: 68 },
  { id: "point-5", value: 58 },
  { id: "point-6", value: 76 },
  { id: "point-7", value: 64 },
  { id: "point-8", value: 84 }
] as const;

export function TimeSeriesChart() {
  return (
    <ChartFrame title="Time series">
      <div
        aria-label="Time series placeholder"
        className="flex h-44 items-end gap-2 border-l border-b border-[var(--color-border-soft)] px-4 pt-4"
        role="img"
      >
        {timeSeriesPoints.map((point) => (
          <div
            aria-hidden="true"
            className="min-h-4 flex-1 bg-[var(--color-brand)]"
            key={point.id}
            style={{ height: `${point.value}%` }}
          />
        ))}
      </div>
    </ChartFrame>
  );
}
