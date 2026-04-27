import { cn } from "@/lib/app/cn";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?:
    | "neutral"
    | "muted"
    | "success"
    | "warning"
    | "danger"
    | "brand"
    | "hot"
    | "cold"
    | "overdue"
    | "prediction"
    | "backtest"
    | "watchlist";
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none px-3 py-1.5 text-xs font-semibold",
        (variant === "neutral" || variant === "muted") &&
          "bg-[var(--muted-soft)] text-[var(--text-muted)]",
        variant === "success" && "bg-[var(--success-soft)] text-[var(--success)]",
        variant === "warning" && "bg-[var(--warning-soft)] text-[var(--warning)]",
        variant === "danger" && "bg-[var(--danger-soft)] text-[var(--danger)]",
        variant === "brand" && "bg-[var(--primary-soft)] text-[var(--primary)]",
        variant === "hot" && "bg-[var(--hot-soft)] text-[var(--hot)]",
        variant === "cold" && "bg-[var(--cold-soft)] text-[var(--cold)]",
        variant === "overdue" && "bg-[var(--overdue-soft)] text-[var(--overdue)]",
        variant === "prediction" && "bg-[var(--prediction-soft)] text-[var(--prediction)]",
        variant === "backtest" && "bg-[var(--backtest-soft)] text-[var(--backtest)]",
        variant === "watchlist" && "bg-[var(--watchlist-soft)] text-[var(--watchlist)]",
        className
      )}
      {...props}
    />
  );
}
