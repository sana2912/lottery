import type * as React from "react";
import { cn } from "@/lib/app/cn";

export type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  action?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
};

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-5 py-8 text-center shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-none bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]">
          {icon}
        </div>
      ) : null}

      <h2 className="text-lg font-semibold tracking-normal text-[var(--color-text-primary)]">
        {title}
      </h2>

      {description ? (
        <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">
          {description}
        </div>
      ) : null}

      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
