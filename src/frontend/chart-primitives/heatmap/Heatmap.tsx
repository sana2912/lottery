import { ChartFrame } from "@/frontend/chart-primitives/d3/ChartFrame";

export type HeatmapCell = {
  id: string;
  label: string;
  value: number;
};

export type HeatmapProps = {
  cells: readonly HeatmapCell[];
  columns?: number;
  title?: string;
};

export function Heatmap({ cells, columns = 10, title = "Heatmap" }: HeatmapProps) {
  const maxValue = Math.max(...cells.map((cell) => cell.value), 1);

  return (
    <ChartFrame title={title}>
      <div
        aria-label={title}
        className="grid gap-px bg-[var(--color-border-soft)]"
        role="img"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cells.map((cell) => (
          <div
            className="flex aspect-square items-center justify-center bg-[var(--color-bg-brand-soft)] text-xs font-semibold text-[var(--color-brand-outline)]"
            key={cell.id}
            style={{ opacity: Math.max(0.22, cell.value / maxValue) }}
            title={`${cell.label}: ${cell.value}`}
          >
            {cell.label}
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}
