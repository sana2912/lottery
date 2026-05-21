"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { patternsContent } from "@/frontend/pages/patterns/patterns.content";
import {
  buildPatternsHref,
  type PatternPageQuery,
  patternMonthOptions,
  patternPrizeOptions,
  patternScopeOptions
} from "@/frontend/pages/patterns/patterns.mappers";
import { Button, Card } from "@/frontend/primitives";

type PatternsFilterPanelProps = Readonly<{
  query: PatternPageQuery;
}>;

export function PatternsFilterPanel({ query }: PatternsFilterPanelProps) {
  const router = useRouter();
  const now = new Date();
  const [prizeType, setPrizeType] = useState(query.prizeType);
  const [scope, setScope] = useState(query.scope);
  const [month, setMonth] = useState(query.month ?? now.getUTCMonth() + 1);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    router.push(
      buildPatternsHref(query, {
        pattern: undefined,
        month: scope === "MONTH" ? month : undefined,
        prizeType,
        scope
      })
    );
  }

  return (
    <Card className="border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 shadow-[var(--shadow-card)]">
      <form
        className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_auto] lg:items-end"
        onSubmit={submitFilters}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
            {patternsContent.filters.prizeQuestion}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            {patternsContent.filters.prizeSummary}
          </p>
          <label
            className="mt-4 block text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]"
            htmlFor="patterns-prize-type"
          >
            {patternsContent.filters.prizeStep}
          </label>
          <select
            className="mt-2 h-11 w-full rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-micro)] focus:border-[var(--color-brand)] focus:outline-none"
            id="patterns-prize-type"
            name="prizeType"
            onChange={(event) => {
              setPrizeType(event.target.value as typeof prizeType);
            }}
            required
            value={prizeType}
          >
            {patternPrizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            All months in history, or one calendar month across every year.
          </p>
          <label
            className="mt-4 block text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]"
            htmlFor="patterns-scope"
          >
            Scope
          </label>
          <select
            className="mt-2 h-11 w-full rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-micro)] focus:border-[var(--color-brand)] focus:outline-none"
            id="patterns-scope"
            name="scope"
            onChange={(event) => {
              setScope(event.target.value as typeof scope);
            }}
            required
            value={scope}
          >
            {patternScopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {scope === "MONTH" ? (
            <select
              className="mt-2 h-11 w-full rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-micro)] focus:border-[var(--color-brand)] focus:outline-none"
              name="month"
              onChange={(event) => {
                setMonth(Number(event.target.value));
              }}
              value={month}
            >
              {patternMonthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
            Action
          </p>
          <Button className="mt-2 h-11 w-full rounded-none lg:min-w-36" type="submit">
            {patternsContent.filters.apply}
          </Button>
        </div>
      </form>
    </Card>
  );
}
