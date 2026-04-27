import { ChartFrame } from "@/frontend/chart-primitives/d3/ChartFrame";

const heatmapCellIds = Array.from({ length: 32 }, (_, index) => `heatmap-cell-${index + 1}`);

export function Heatmap() {
  return (
    <ChartFrame title="Heatmap">
      <div
        aria-label="Heatmap placeholder"
        className="grid h-44 grid-cols-8 gap-px bg-[var(--color-border-soft)]"
        role="img"
      >
        {heatmapCellIds.map((cellId) => (
          <div aria-hidden="true" className="bg-[var(--color-bg-brand-soft)]" key={cellId} />
        ))}
      </div>
    </ChartFrame>
  );
}
