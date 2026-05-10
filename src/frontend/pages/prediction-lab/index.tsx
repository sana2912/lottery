"use client";

import { AlertCircle, FlaskConical, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, MetricCard } from "@/frontend/components";
import { predictionLabContent } from "@/frontend/pages/prediction-lab/prediction-lab.content";
import {
  generatePredictionRun,
  getLatestPredictionRun
} from "@/frontend/pages/prediction-lab/prediction-lab.data";
import {
  defaultPredictionFormState,
  getPredictionPositionLabel,
  getPredictionScoreLabel,
  getTopPredictionScore,
  toPredictionPayload,
  toPredictionWatchlistPayload
} from "@/frontend/pages/prediction-lab/prediction-lab.mappers";
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
  predictionRequestSchema
} from "@/schema/app/prediction.schema";
import { createWatchlistItemSchema } from "@/schema/app/watchlist.schema";

export function PredictionLabPage() {
  const [formState, setFormState] = useState(defaultPredictionFormState);
  const [runState, setRunState] = useState<
    "empty" | "error" | "loading" | "noCandidates" | "ready"
  >("loading");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [savedNumbers, setSavedNumbers] = useState<Set<string>>(() => new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const topScore = useMemo(() => getTopPredictionScore(prediction), [prediction]);
  const selectedPrize = useMemo(
    () =>
      predictionLabContent.prizeOptions.find((option) => option.value === formState.prizeType) ??
      predictionLabContent.prizeOptions[0],
    [formState.prizeType]
  );

  useEffect(() => {
    let isActive = true;

    async function loadLatestPrediction() {
      try {
        const latestPrediction = await getLatestPredictionRun();

        if (!isActive) {
          return;
        }

        setPrediction(latestPrediction);
        if (!latestPrediction) {
          setRunState("empty");
        } else if (latestPrediction.results.length > 0) {
          setRunState("ready");
        } else {
          setRunState("noCandidates");
        }
      } catch {
        if (!isActive) {
          return;
        }

        setRunState("error");
      }
    }

    void loadLatestPrediction();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleGenerate() {
    setIsPending(true);
    setError(null);

    const payload = predictionRequestSchema.parse(toPredictionPayload(formState));

    try {
      const response = await generatePredictionRun(payload);
      setPrediction(response);
      setRunState(response.results.length > 0 ? "ready" : "noCandidates");
    } catch {
      setError(predictionLabContent.errorMessages.predictionUnavailable);
    } finally {
      setIsPending(false);
    }
  }

  async function handleSaveToWatchlist(result: PredictionResult) {
    setSaveError(null);

    const payload = createWatchlistItemSchema.parse(toPredictionWatchlistPayload(result));

    try {
      await apiPost(apiRoutes.watchlist, payload);
      setSavedNumbers((current) => new Set([...current, result.number]));
    } catch {
      setSaveError(predictionLabContent.errorMessages.watchlistSaveFailed);
    }
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--prediction)]">
            {predictionLabContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {predictionLabContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {predictionLabContent.hero.description}
          </p>
          <div className="mt-4">
            <Button asChild className="px-0" variant="link">
              <Link href={predictionLabContent.actions.methodologyHref}>
                {predictionLabContent.actions.methodologyLabel}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={predictionLabContent.sections.currentResult.eyebrow}
            title={predictionLabContent.sections.currentResult.title}
          />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint={predictionLabContent.metrics.topScore.hint}
              label={predictionLabContent.metrics.topScore.label}
              tone="prediction"
              value={topScore}
            />
            <MetricCard
              hint={predictionLabContent.metrics.candidates.hint}
              label={predictionLabContent.metrics.candidates.label}
              value={String(prediction?.results.length ?? 0)}
            />
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow={predictionLabContent.sections.generationSettings.eyebrow}
          title={predictionLabContent.sections.generationSettings.title}
        />
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
                <SelectValue placeholder={predictionLabContent.selectPlaceholders.strategy} />
              </SelectTrigger>
              <SelectContent>
                {predictionLabContent.strategyOptions.map((strategy) => (
                  <SelectItem key={strategy.value} value={strategy.value}>
                    {strategy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prizeType">Prize type</Label>
            <Select
              value={formState.prizeType}
              onValueChange={(prizeType) =>
                setFormState((current) => ({
                  ...current,
                  prizeType: prizeType as PredictionRequest["prizeType"]
                }))
              }
            >
              <SelectTrigger id="prizeType">
                <SelectValue placeholder={predictionLabContent.selectPlaceholders.prizeType} />
              </SelectTrigger>
              <SelectContent>
                {predictionLabContent.prizeOptions.map((prize) => (
                  <SelectItem key={prize.value} value={prize.value}>
                    {prize.label}
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
            <Label>Derived length</Label>
            <div className="flex h-10 items-center border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-secondary)]">
              {selectedPrize.numberLength} digits
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button disabled={isPending} onClick={handleGenerate} type="button">
            {isPending ? <Loader2 className="animate-spin" /> : <FlaskConical />}
            {predictionLabContent.actions.generate}
          </Button>
          <Button asChild className="px-0" variant="link">
            <Link href={predictionLabContent.actions.breakdownHref}>
              {predictionLabContent.actions.breakdownLabel}
            </Link>
          </Button>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            {predictionLabContent.notes.resultSummary}
          </p>
        </div>
      </Card>

      {runState === "loading" ? (
        <EmptyState
          description={predictionLabContent.emptyStates.loading.description}
          icon={<Loader2 className="animate-spin" />}
          title={predictionLabContent.emptyStates.loading.title}
        />
      ) : null}

      {error ? (
        <EmptyState
          description={error}
          icon={<AlertCircle />}
          title={predictionLabContent.emptyStates.predictionError.title}
        />
      ) : null}

      {saveError ? (
        <EmptyState
          description={saveError}
          icon={<AlertCircle />}
          title={predictionLabContent.emptyStates.watchlistError.title}
        />
      ) : null}

      {runState === "error" && !error ? (
        <EmptyState
          description={predictionLabContent.errorMessages.predictionUnavailable}
          icon={<AlertCircle />}
          title={predictionLabContent.emptyStates.predictionError.title}
        />
      ) : null}

      {runState === "empty" && !error ? (
        <EmptyState
          description={predictionLabContent.emptyStates.noRun.description}
          icon={<FlaskConical />}
          title={predictionLabContent.emptyStates.noRun.title}
        />
      ) : null}

      {runState === "noCandidates" && prediction && !error ? (
        <EmptyState
          description={predictionLabContent.emptyStates.noCandidates.description}
          icon={<FlaskConical />}
          title={predictionLabContent.emptyStates.noCandidates.title}
        />
      ) : null}

      {prediction && runState === "ready" ? (
        <section className="grid gap-4">
          {prediction.results.map((result) => (
            <Card className="p-5" key={result.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">
                      {result.number}
                    </p>
                    <Badge variant="prediction">
                      {predictionLabContent.results.rankLabel} {result.rank}
                    </Badge>
                    <Badge variant="neutral">{result.strategyName}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {result.version} / {predictionLabContent.results.versionWindowLabel}{" "}
                    {result.inputWindow}
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
                    ? predictionLabContent.actions.savedToWatchlist
                    : predictionLabContent.actions.saveToWatchlist}
                </Button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-5">
                {Object.entries(result.scoreBreakdown).map(([label, value]) => (
                  <MetricCard
                    key={label}
                    label={getPredictionScoreLabel(label)}
                    value={String(value)}
                  />
                ))}
              </div>

              <div className="mt-5 border-t border-[var(--color-border-soft)] pt-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Position breakdown
                </p>
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  {result.positionBreakdown.map((position) => (
                    <div
                      className="border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-4"
                      key={`${result.id}-${position.positionIndex}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-normal text-[var(--color-text-muted)]">
                            {getPredictionPositionLabel(
                              position.positionIndex,
                              result.numberLength
                            )}
                          </p>
                          <p className="mt-1 font-mono text-2xl font-bold text-[var(--color-text-primary)]">
                            {position.digit}
                          </p>
                        </div>
                        <Badge
                          variant={
                            position.tone === "hot"
                              ? "hot"
                              : position.tone === "cold"
                                ? "cold"
                                : "muted"
                          }
                        >
                          {position.tone}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <MetricCard label="Hot" value={String(position.hot)} />
                        <MetricCard label="Overdue" value={String(position.overdue)} />
                        <MetricCard label="Trend" value={String(position.position)} />
                      </div>
                      <ul className="mt-3 space-y-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                        {position.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-[var(--color-border-soft)] pt-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {predictionLabContent.results.reasonsTitle}
                </p>
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
