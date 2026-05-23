"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { buildPatternsHref } from "@/frontend/pages/patterns/patterns.mappers";
import { predictionLabContent } from "@/frontend/pages/prediction-lab/prediction-lab.content";
import type { PatternPlaygroundOption } from "@/frontend/pages/prediction-lab/prediction-lab.data";
import { Badge, Button, SectionHeading } from "@/frontend/primitives";
import { formatPatternOptionLabel, type PatternTone } from "@/lib/app/pattern-playground";
import type { PredictionRequest } from "@/schema/app/prediction.schema";

type PredictionPatternPlaygroundProps = Readonly<{
  disabled?: boolean;
  loadState: "error" | "loading" | "ready";
  onClear: () => void;
  onToggle: (patternId: string) => void;
  options: readonly PatternPlaygroundOption[];
  prizeType: PredictionRequest["prizeType"];
  selectedPatternIds: readonly string[];
}>;

export function PredictionPatternPlayground({
  disabled = false,
  loadState,
  onClear,
  onToggle,
  options,
  prizeType,
  selectedPatternIds
}: PredictionPatternPlaygroundProps) {
  const patternsHref = buildPatternsHref({
    prizeType,
    scope: "ALL_TIME"
  });

  return (
    <div className="space-y-4 border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow={predictionLabContent.sections.patternPlayground.eyebrow}
          title={predictionLabContent.sections.patternPlayground.title}
        />
        <div className="flex flex-wrap gap-2">
          {selectedPatternIds.length > 0 ? (
            <Button
              className="rounded-none"
              disabled={disabled}
              onClick={onClear}
              size="sm"
              type="button"
              variant="outline"
            >
              {predictionLabContent.sections.patternPlayground.clearAll}
            </Button>
          ) : null}
          <Button asChild className="rounded-none" size="sm" type="button" variant="ghost">
            <Link href={patternsHref}>
              {predictionLabContent.sections.patternPlayground.patternsLink}
            </Link>
          </Button>
        </div>
      </div>

      <p className="max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
        {predictionLabContent.sections.patternPlayground.descriptionTh}{" "}
        <span className="text-[var(--color-text-muted)]">
          {predictionLabContent.sections.patternPlayground.description}
        </span>
      </p>

      {loadState === "loading" ? (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="size-4 animate-spin" />
          Loading pattern statistics…
        </div>
      ) : null}

      {loadState === "error" ? (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <AlertCircle className="size-4" />
          {predictionLabContent.errorMessages.patternStatsUnavailable}
        </div>
      ) : null}

      {loadState === "ready" ? (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = selectedPatternIds.includes(option.id);

            return (
              <Button
                aria-pressed={selected}
                className="rounded-none"
                disabled={disabled}
                key={option.id}
                onClick={() => onToggle(option.id)}
                size="sm"
                type="button"
                variant={selected ? "secondary" : "outline"}
              >
                <span>{formatPatternOptionLabel(option.label, option.percent)}</span>
                <Badge className="ml-2" variant={getPatternBadgeVariant(option.tone)}>
                  {option.tone}
                </Badge>
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function getPatternBadgeVariant(tone: PatternTone) {
  switch (tone) {
    case "cold":
      return "cold";
    case "hot":
      return "hot";
    case "overdue":
      return "overdue";
    case "success":
      return "success";
    case "warning":
      return "warning";
    default:
      return "neutral";
  }
}
