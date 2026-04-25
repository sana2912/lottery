import { cn } from "@/lib/app/cn";

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)]">
      <table
        className={cn("w-full border-collapse bg-[var(--color-bg-canvas)]", className)}
        {...props}
      />
    </div>
  );
}

export type TableSectionProps = React.HTMLAttributes<HTMLTableSectionElement>;

export function TableHeader({ className, ...props }: TableSectionProps) {
  return <thead className={cn("bg-[var(--color-bg-subtle)]", className)} {...props} />;
}

export function TableBody({ className, ...props }: TableSectionProps) {
  return <tbody className={cn(className)} {...props} />;
}

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn("border-b border-[var(--color-border-soft)] last:border-b-0", className)}
      {...props}
    />
  );
}

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 text-sm leading-6 text-[var(--color-text-secondary)]", className)}
      {...props}
    />
  );
}
