import { cn } from "@/lib/app/cn";

export type TabsProps = React.HTMLAttributes<HTMLDivElement>;

export function Tabs({ className, ...props }: TabsProps) {
  return <div className={cn("space-y-4", className)} {...props} />;
}

export type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      className={cn("inline-flex rounded-none bg-[var(--color-bg-subtle)] p-1", className)}
      {...props}
    />
  );
}

export type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function TabsTrigger({
  active = false,
  className,
  type = "button",
  ...props
}: TabsTriggerProps) {
  return (
    <button
      className={cn(
        "rounded-none px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] shadow-[var(--shadow-micro)]"
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
        className
      )}
      type={type}
      {...props}
    />
  );
}

export type TabsPanelProps = React.HTMLAttributes<HTMLDivElement>;

export function TabsPanel({ className, ...props }: TabsPanelProps) {
  return <div className={cn("rounded-none", className)} {...props} />;
}
