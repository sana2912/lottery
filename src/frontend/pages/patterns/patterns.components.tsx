"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { patternsContent } from "@/frontend/pages/patterns/patterns.content";
import type { PatternExample } from "@/frontend/pages/patterns/patterns.mappers";
import {
  buildPatternsHref,
  type PatternPageQuery,
  patternMonthOptions,
  patternPrizeOptions,
  patternScopeOptions
} from "@/frontend/pages/patterns/patterns.mappers";
import { Badge, Button, Card, SectionHeading } from "@/frontend/primitives";

type PatternExamplesPanelProps = Readonly<{
  examples: readonly PatternExample[];
  query: PatternPageQuery;
}>;

export function PatternExamplesPanel({ examples, query }: PatternExamplesPanelProps) {
  const router = useRouter();
  const showRandomControls = Boolean(query.pattern);

  function shuffleExamples() {
    router.push(
      buildPatternsHref(query, {
        exampleSeed: String(Date.now())
      })
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow={patternsContent.sections.examples.eyebrow}
          title={patternsContent.sections.examples.title}
        />
        {showRandomControls ? (
          <Button className="rounded-none" onClick={shuffleExamples} size="sm" type="button">
            {patternsContent.sections.examples.shuffle}
          </Button>
        ) : null}
      </div>
      {showRandomControls ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
          {patternsContent.sections.examples.randomHintTh}{" "}
          <span className="text-[var(--color-text-muted)]">
            {patternsContent.sections.examples.randomHint}
          </span>
        </p>
      ) : null}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {examples.map((example) => (
          <article
            className="border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-4"
            key={`${example.prizeType}-${example.number}-${example.synthetic ? "s" : "h"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-2xl font-bold tracking-normal text-[var(--color-text-primary)]">
                  {example.number}
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                  {example.prizeType}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {example.synthetic ? (
                  <Badge variant="neutral">
                    {patternsContent.sections.examples.syntheticBadge}
                  </Badge>
                ) : null}
                <Badge variant="neutral">mini DNA</Badge>
              </div>
            </div>
            <p className="mt-3 font-mono text-xs text-[var(--color-text-secondary)]">
              {example.dna}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {example.flags.map((flag) => (
                <Badge key={`${example.number}-${flag}`} variant="brand">
                  {flag}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

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
        exampleSeed: undefined,
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
