import { cn } from "@/lib/app/cn";

export type MetricCardProps = Readonly<{
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "hot" | "cold" | "overdue" | "prediction" | "backtest";
  trend?: string;
}>;

const toneClasses = {
  default: "border-[var(--color-border-default)]",
  hot: "border-[var(--hot)]/25 bg-[var(--hot-soft)]/35",
  cold: "border-[var(--cold)]/35 bg-[var(--cold-soft)]/55",
  overdue: "border-[var(--overdue)]/35 bg-[var(--overdue-soft)]/55",
  prediction: "border-[var(--prediction)]/25 bg-[var(--prediction-soft)]/45",
  backtest: "border-[var(--backtest)]/25 bg-[var(--backtest-soft)]/45"
} as const;

export function MetricCard({ label, value, hint, tone = "default", trend }: MetricCardProps) {
  return (
    <article
      className={cn(
        "rounded-none border bg-[var(--color-bg-canvas)] p-5 shadow-[var(--shadow-card)]",
        toneClasses[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
        {trend ? (
          <span className="rounded-none bg-[var(--muted-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-normal text-[var(--text-title)]">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{hint}</p> : null}
    </article>
  );
}
