import { cn } from "@/lib/app/cn";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "subtle";
};

export function Button({ className, type = "button", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-none border px-4 py-3 text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-bg-brand-soft-strong)]",
        variant === "primary" &&
          "border-[var(--color-brand)] bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-strong)]",
        variant === "outline" &&
          "border-[var(--color-brand-outline)] bg-[var(--color-bg-canvas)] text-[var(--color-brand-outline)] hover:bg-[#f5f1ff]",
        variant === "subtle" &&
          "border-transparent bg-[var(--color-bg-brand-soft)] text-[var(--color-brand)] hover:bg-[var(--color-bg-brand-soft-strong)]",
        className
      )}
      type={type}
      {...props}
    />
  );
}
