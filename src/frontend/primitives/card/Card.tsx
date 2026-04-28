import { cn } from "@/lib/app/cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-none border border-[var(--color-border-glass)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.58))] shadow-[var(--shadow-glass)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(28,25,23,0.78),rgba(28,25,23,0.62))]",
        className
      )}
      {...props}
    />
  );
}
