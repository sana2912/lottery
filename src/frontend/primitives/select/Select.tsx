import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/app/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ children, className, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 pr-11 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-micro)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-bg-brand-soft-strong)]",
          className
        )}
        {...props}
      >
        {children}
      </select>

      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
    </div>
  );
}
