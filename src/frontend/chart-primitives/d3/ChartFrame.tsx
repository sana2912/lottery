import type * as React from "react";
import { cn } from "@/lib/app/cn";

export type ChartFrameProps = {
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

export function ChartFrame({ children, className, title }: ChartFrameProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] shadow-[var(--shadow-card)]",
        className
      )}
    >
      {title ? (
        <div className="border-b border-[var(--color-border-soft)] px-5 py-4">
          <h3 className="text-sm font-semibold tracking-normal text-[var(--color-text-primary)]">
            {title}
          </h3>
        </div>
      ) : null}

      <div className="min-h-56 p-5">{children}</div>
    </section>
  );
}
