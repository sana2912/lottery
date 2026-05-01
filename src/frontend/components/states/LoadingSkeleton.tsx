import type * as React from "react";
import { cn } from "@/lib/app/cn";

const cardLineWidths = [96, 82, 68, 54, 44, 44, 44, 44] as const;
const chartBarHeights = [42, 68, 54, 82, 63, 76, 48, 88] as const;
const tableColumns = ["draw", "number", "status", "score"] as const;
const tableRows = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth"
] as const;

export type LoadingSkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  lines?: number;
  variant?: "card" | "chart" | "table";
};

export function LoadingSkeleton({
  className,
  lines = 3,
  variant = "card",
  ...props
}: LoadingSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 shadow-[var(--shadow-card)]",
        className
      )}
      role="status"
      {...props}
    >
      <span className="sr-only">Loading</span>
      {variant === "chart" ? <ChartSkeleton /> : null}
      {variant === "table" ? <TableSkeleton lines={lines} /> : null}
      {variant === "card" ? <CardSkeleton lines={lines} /> : null}
    </div>
  );
}

function CardSkeleton({ lines }: Readonly<{ lines: number }>) {
  const visibleLines = cardLineWidths.slice(0, lines);

  return (
    <div className="space-y-4">
      <div className="h-4 w-32 rounded-none bg-[var(--color-bg-subtle)]" />
      <div className="h-8 w-48 rounded-none bg-[var(--color-bg-subtle)]" />
      <div className="space-y-2">
        {visibleLines.map((width) => (
          <div
            className="h-3 rounded-none bg-[var(--color-bg-subtle)]"
            key={`card-skeleton-${width}`}
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-56 items-end gap-3 border-l border-b border-[var(--color-border-soft)] px-4 pt-4">
      {chartBarHeights.map((height) => (
        <div
          className="min-h-8 flex-1 rounded-none bg-[var(--color-bg-subtle)]"
          key={`chart-skeleton-${height}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function TableSkeleton({ lines }: Readonly<{ lines: number }>) {
  const visibleRows = tableRows.slice(0, lines);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3 border-b border-[var(--color-border-soft)] pb-3">
        {tableColumns.map((column) => (
          <div
            className="h-4 rounded-none bg-[var(--color-bg-subtle)]"
            key={`table-heading-skeleton-${column}`}
          />
        ))}
      </div>

      {visibleRows.map((row) => (
        <div className="grid grid-cols-4 gap-3" key={`table-row-skeleton-${row}`}>
          {tableColumns.map((column) => (
            <div
              className="h-3 rounded-none bg-[var(--color-bg-subtle)]"
              key={`table-cell-skeleton-${row}-${column}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
