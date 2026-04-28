"use client";

import { AlertCircle, FlaskConical, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, MetricCard } from "@/frontend/components";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  SectionHeading,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/frontend/primitives";
import { apiPost } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type PredictionRequest,
  type PredictionResponse,
  type PredictionResult,
  predictionRequestSchema,
  predictionResponseSchema
} from "@/schema/app/prediction.schema";
import { createWatchlistItemSchema } from "@/schema/app/watchlist.schema";

const strategyOptions = [
  { label: "Balanced", value: "balanced" },
  { label: "Hot trend", value: "hotTrend" },
  { label: "Cold rebound", value: "coldRebound" }
] as const;

type PredictionFormState = {
  count: string;
  numberLength: string;
  strategyId: PredictionRequest["strategyId"];
  windowSize: string;
};

const defaultFormState: PredictionFormState = {
  count: "5",
  numberLength: "2",
  strategyId: "balanced",
  windowSize: "120"
};

export function PredictionLabPage() {
  const [formState, setFormState] = useState(defaultFormState);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [savedNumbers, setSavedNumbers] = useState<Set<string>>(() => new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const topScore = useMemo(
    () => prediction?.results[0]?.score.toString() ?? "-",
    [prediction?.results]
  );

  async function handleGenerate() {
    setIsPending(true);
    setError(null);

    const payload = predictionRequestSchema.parse({
      count: formState.count,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: formState.numberLength,
      prizeType: "TWO_DIGIT",
      strategyId: formState.strategyId,
      windowSize: formState.windowSize
    });

    try {
      const response = await apiPost<PredictionResponse>(apiRoutes.predictions, payload, {
        schema: predictionResponseSchema
      });
      setPrediction(response);
    } catch {
      setError("Prediction API is not available yet. Check database seed data and API runtime.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleSaveToWatchlist(result: PredictionResult) {
    setSaveError(null);

    const payload = createWatchlistItemSchema.parse({
      note: `Saved from Prediction Lab using ${result.strategyName}. Score: ${result.score}.`,
      number: result.number,
      source: "PREDICTION",
      tags: ["prediction", result.strategyId]
    });

    try {
      await apiPost(apiRoutes.watchlist, payload);
      setSavedNumbers((current) => new Set([...current, result.number]));
    } catch {
      setSaveError("Unable to save this number to the global watchlist.");
    }
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--prediction)]">
            Prediction Lab
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            Generate explainable number candidates
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            Strategies rank historical signals from analytics data. Scores are analysis outputs, not
            guarantees.
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Run summary" title="Current result" />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint="Highest score from the latest generated result."
              label="Top score"
              tone="prediction"
              value={topScore}
            />
            <MetricCard
              hint="Candidate count from the latest run."
              label="Candidates"
              value={String(prediction?.results.length ?? 0)}
            />
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading eyebrow="Strategy input" title="Generation settings" />
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="strategyId">Strategy</Label>
            <Select
              value={formState.strategyId}
              onValueChange={(strategyId) =>
                setFormState((current) => ({
                  ...current,
                  strategyId: strategyId as PredictionRequest["strategyId"]
                }))
              }
            >
              <SelectTrigger id="strategyId">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategyOptions.map((strategy) => (
                  <SelectItem key={strategy.value} value={strategy.value}>
                    {strategy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="windowSize">Window size</Label>
            <Input
              id="windowSize"
              inputMode="numeric"
              min={1}
              onChange={(event) =>
                setFormState((current) => ({ ...current, windowSize: event.target.value }))
              }
              type="number"
              value={formState.windowSize}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Candidates</Label>
            <Input
              id="count"
              inputMode="numeric"
              max={20}
              min={1}
              onChange={(event) =>
                setFormState((current) => ({ ...current, count: event.target.value }))
              }
              type="number"
              value={formState.count}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberLength">Number length</Label>
            <Input
              id="numberLength"
              inputMode="numeric"
              max={6}
              min={2}
              onChange={(event) =>
                setFormState((current) => ({ ...current, numberLength: event.target.value }))
              }
              type="number"
              value={formState.numberLength}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button disabled={isPending} onClick={handleGenerate} type="button">
            {isPending ? <Loader2 className="animate-spin" /> : <FlaskConical />}
            Generate
          </Button>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Results use historical analytics signals and should be read as exploratory ranking.
          </p>
        </div>
      </Card>

      {error ? (
        <EmptyState
          description={error}
          icon={<AlertCircle />}
          title="Unable to generate predictions"
        />
      ) : null}

      {saveError ? (
        <EmptyState description={saveError} icon={<AlertCircle />} title="Watchlist save failed" />
      ) : null}

      {!prediction && !error ? (
        <EmptyState
          description="Choose a strategy and generate candidates to inspect score breakdowns and reasons."
          icon={<FlaskConical />}
          title="No prediction run yet"
        />
      ) : null}

      {prediction ? (
        <section className="grid gap-4">
          {prediction.results.map((result) => (
            <Card className="p-5" key={result.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">
                      {result.number}
                    </p>
                    <Badge variant="prediction">Rank {result.rank}</Badge>
                    <Badge variant="neutral">{result.strategyName}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {result.version} / window {result.inputWindow}
                  </p>
                </div>

                <MetricCard
                  hint="Weighted signal score from the selected strategy."
                  label="Score"
                  tone="prediction"
                  value={String(result.score)}
                />
              </div>

              <div className="mt-5">
                <Button
                  disabled={savedNumbers.has(result.number)}
                  onClick={() => handleSaveToWatchlist(result)}
                  type="button"
                  variant="outline"
                >
                  {savedNumbers.has(result.number)
                    ? "Saved to global watchlist"
                    : "Save to watchlist"}
                </Button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-5">
                {Object.entries(result.scoreBreakdown).map(([label, value]) => (
                  <MetricCard key={label} label={label} value={String(value)} />
                ))}
              </div>

              <div className="mt-5 border-t border-[var(--color-border-soft)] pt-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Reasons</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </section>
      ) : null}
    </main>
  );
}
