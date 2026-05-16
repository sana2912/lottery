"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { calendarContent } from "@/frontend/pages/calendar/calendar.content";
import {
  type CalendarPageFilters,
  getCalendarMonthOptions,
  getCalendarPrizeTypeOptions,
  getCalendarScopeOptions,
  getCalendarWindowPresetOptions
} from "@/frontend/pages/calendar/calendar.mappers";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/frontend/primitives";

type CalendarHeatmapFiltersProps = {
  filters: CalendarPageFilters;
};

export function CalendarHeatmapFilters({ filters }: CalendarHeatmapFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthOptions = getCalendarMonthOptions();
  const prizeTypeOptions = getCalendarPrizeTypeOptions();
  const scopeOptions = getCalendarScopeOptions();
  const windowPresetOptions = getCalendarWindowPresetOptions();

  function updateQuery(nextPartialFilters: Partial<CalendarPageFilters>) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    const nextFilters = { ...filters, ...nextPartialFilters };

    if (nextFilters.scope === "MONTH" && nextFilters.month) {
      nextSearchParams.set("month", String(nextFilters.month));
    } else {
      nextSearchParams.delete("month");
    }

    nextSearchParams.set("prizeType", nextFilters.prizeType);
    nextSearchParams.set("scope", nextFilters.scope);
    nextSearchParams.set("windowPreset", nextFilters.windowPreset);
    nextSearchParams.delete("windowSize");

    router.replace(
      nextSearchParams.toString() ? `${pathname}?${nextSearchParams.toString()}` : pathname
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-4">
      <Field label="Scope">
        <Select
          onValueChange={(value) =>
            updateQuery({
              month:
                value === "MONTH" ? (filters.month ?? new Date().getUTCMonth() + 1) : undefined,
              scope: value as CalendarPageFilters["scope"]
            })
          }
          value={filters.scope}
        >
          <SelectTrigger className="h-11 w-full rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]">
            <SelectValue placeholder="Analysis scope" />
          </SelectTrigger>
          <SelectContent>
            {scopeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={calendarContent.filters.month.label}>
        <Select
          disabled={filters.scope !== "MONTH"}
          onValueChange={(value) =>
            updateQuery({
              month: Number(value)
            })
          }
          value={String(filters.month ?? new Date().getUTCMonth() + 1)}
        >
          <SelectTrigger className="h-11 w-full rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]">
            <SelectValue placeholder={calendarContent.filters.month.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={calendarContent.filters.prizeType.label}>
        <Select
          onValueChange={(value) =>
            updateQuery({
              prizeType: value as CalendarPageFilters["prizeType"]
            })
          }
          value={filters.prizeType}
        >
          <SelectTrigger className="h-11 w-full rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]">
            <SelectValue placeholder={calendarContent.filters.prizeType.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {prizeTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={calendarContent.filters.windowSize.label}>
        <Select
          onValueChange={(value) =>
            updateQuery({
              windowPreset: value as CalendarPageFilters["windowPreset"],
              windowSize: value === "ALL" ? 500 : Number(value)
            })
          }
          value={filters.windowPreset}
        >
          <SelectTrigger className="h-11 w-fulls rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]">
            <SelectValue placeholder={calendarContent.filters.windowSize.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {windowPresetOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Field({
  children,
  label
}: Readonly<{
  children: ReactNode;
  label: string;
}>) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
        {label}
      </Label>
      {children}
    </div>
  );
}
