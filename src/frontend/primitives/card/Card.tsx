import { cn } from "@/lib/app/cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  );
}
