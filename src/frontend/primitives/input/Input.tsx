import { cn } from "@/lib/app/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 text-sm text-[var(--color-text-primary)]",
        "placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-bg-brand-soft-strong)]",
        className
      )}
      {...props}
    />
  );
}
