import type * as React from "react";
import { cn } from "@/lib/app/cn";

export type FilterToolbarProps = React.HTMLAttributes<HTMLDivElement> & {
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  summary?: React.ReactNode;
};

export function FilterToolbar({
  actions,
  className,
  filters,
  summary,
  ...props
}: FilterToolbarProps) {
  return (
    <section
      className={cn(
        "rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4 shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{filters}</div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {summary ? (
        <div className="mt-4 border-t border-[var(--color-border-soft)] pt-4 text-sm leading-6 text-[var(--color-text-muted)]">
          {summary}
        </div>
      ) : null}
    </section>
  );
}
