import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/app/cn";

export type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn("text-sm font-medium leading-6 text-[var(--color-text-secondary)]", className)}
      {...props}
    />
  );
}
