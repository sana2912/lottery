import { cn } from "@/lib/app/cn";

export type SectionHeadingProps = React.HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function SectionHeading({
  actions,
  className,
  description,
  eyebrow,
  title,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
    </div>
  );
}
