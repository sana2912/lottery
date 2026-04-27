import { cn } from "@/lib/app/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 text-sm leading-7 text-[var(--color-text-primary)] shadow-[var(--shadow-micro)]",
        "placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-bg-brand-soft-strong)]",
        className
      )}
      {...props}
    />
  );
}
