import { TrendingUp } from "lucide-react";
import { homeContent } from "@/frontend/pages/home/home.content";

export function ProductPreview() {
  const preview = homeContent.hero.preview;
  const highestTrendValue = Math.max(...preview.trendValues);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-6 right-4 hidden w-[640px] lg:block xl:right-10"
    >
      <div className="absolute inset-0 rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] shadow-[var(--shadow-card)]" />
      <div className="absolute left-8 top-8 w-[330px] rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
            {preview.status}
          </span>
          <span className="rounded-none bg-[var(--color-bg-success-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-text-success)]">
            {preview.readyLabel}
          </span>
        </div>
        <p className="mt-5 text-sm font-medium text-[var(--color-text-secondary)]">
          {preview.latestDrawLabel}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-normal text-[var(--color-text-primary)]">
          {preview.latestDraw}
        </p>
        <div className="mt-5 grid grid-cols-[120px_minmax(0,1fr)] gap-4">
          <div className="rounded-none bg-[var(--color-bg-brand-soft)] p-4">
            <p className="text-xs font-semibold text-[var(--color-brand-outline)]">
              {preview.highlightLabel}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-normal text-[var(--color-brand)]">
              {preview.highlightNumber}
            </p>
          </div>
          <div className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4">
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
              {preview.scoreLabel}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
              {preview.score}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-8 w-[360px] rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {preview.trendLabel}
          </span>
          <TrendingUp className="size-4 text-[var(--color-brand)]" />
        </div>
        <div className="mt-5 flex h-24 items-end gap-3">
          {preview.trendValues.map((value) => (
            <div
              className="min-h-4 flex-1 rounded-none bg-[var(--color-brand)]"
              key={value}
              style={{ height: `${(value / highestTrendValue) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-4">
          <span className="text-sm text-[var(--color-text-secondary)]">
            {preview.watchlistLabel}
          </span>
          <span className="text-xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {preview.watchlistCount}
          </span>
        </div>
      </div>
    </div>
  );
}
