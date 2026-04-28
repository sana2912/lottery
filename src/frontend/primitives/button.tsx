import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/app";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-none text-sm font-semibold whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-[color:rgba(255,255,255,0.18)] bg-[linear-gradient(180deg,var(--primary),var(--primary-hover))] text-primary-foreground shadow-[var(--shadow-micro)] hover:brightness-[1.03]",
        primary:
          "border border-[color:rgba(255,255,255,0.18)] bg-[linear-gradient(180deg,var(--primary),var(--primary-hover))] text-primary-foreground shadow-[var(--shadow-micro)] hover:brightness-[1.03]",
        destructive:
          "bg-destructive text-[var(--destructive-foreground)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        danger:
          "bg-[var(--danger)] text-[var(--destructive-foreground)] hover:bg-[var(--danger)]/90 focus-visible:ring-[var(--danger)]/20",
        outline:
          "border border-[var(--color-border-glass)] bg-[var(--color-bg-glass)] shadow-[var(--shadow-micro)] backdrop-blur-lg hover:bg-[var(--color-bg-glass-strong)] hover:text-foreground",
        secondary:
          "border border-[color:rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,var(--secondary),color-mix(in srgb,var(--secondary) 88%, black))] text-[var(--secondary-foreground)] shadow-[var(--shadow-micro)] hover:brightness-[1.03]",
        ghost:
          "border border-transparent bg-transparent hover:border-[var(--color-border-glass)] hover:bg-[var(--color-bg-glass)] hover:text-foreground hover:backdrop-blur-lg",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-none px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-none px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-none px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-none [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
