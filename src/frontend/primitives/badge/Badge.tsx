import { cn } from "@/lib/app/cn";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "success" | "brand";
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none px-3 py-2 text-xs font-semibold",
        variant === "neutral" && "bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]",
        variant === "success" &&
          "bg-[var(--color-bg-success-soft)] text-[var(--color-text-success)]",
        variant === "brand" && "bg-[var(--color-bg-brand-soft)] text-[var(--color-brand-outline)]",
        className
      )}
      {...props}
    />
  );
}
