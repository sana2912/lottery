"use client";

import { AlertCircle, Loader2, Scale3d } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TimeSeriesChart } from "@/frontend/chart-primitives";
import { EmptyState, FilterToolbar, LoadingSkeleton, MetricCard } from "@/frontend/components";
import { compareContent } from "@/frontend/pages/compare/compare.content";
import { runCompareRequest } from "@/frontend/pages/compare/compare.data";
import {
  type CompareFormState,
  defaultCompareFormState,
  toCompareChartPoints,
  toComparePayload
} from "@/frontend/pages/compare/compare.mappers";
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
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea
} from "@/frontend/primitives";
import { type CompareReadModel, compareRequestSchema } from "@/schema/app/compare.schema";

export function ComparePage() {
  const [formState, setFormState] = useState(defaultCompareFormState);
  const [compareState, setCompareState] = useState<"empty" | "error" | "ready">("empty");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState<CompareReadModel | null>(null);

  const chartPoints = useMemo(() => (compare ? toCompareChartPoints(compare) : []), [compare]);

  async function handleCompare() {
    setIsPending(true);
    setError(null);

    try {
      const payload = compareRequestSchema.parse(toComparePayload(formState));
      const response = await runCompareRequest(payload);

      setCompare(response);
      setCompareState(response.candidates.length > 0 ? "ready" : "empty");
    } catch {
      setError(compareContent.errorMessage);
      setCompareState(compare ? "ready" : "error");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--prediction)]">
            {compareContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {compareContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {compareContent.hero.description}
          </p>
          <div className="mt-4">
            <Button asChild className="px-0" variant="link">
              <Link href={compareContent.actions.methodologyHref}>
                {compareContent.actions.methodologyLabel}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={compareContent.sections.currentRun.eyebrow}
            title={compareContent.sections.currentRun.title}
          />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint={compareContent.metrics.topScore.hint}
              label={compareContent.metrics.topScore.label}
              tone="prediction"
              value={String(compare?.candidates[0]?.score ?? 0)}
            />
            <MetricCard
              hint={compareContent.metrics.candidates.hint}
              label={compareContent.metrics.candidates.label}
              value={String(compare?.candidates.length ?? 0)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={compareState === "ready" ? "success" : "warning"}>
              {compareState === "ready"
                ? compareContent.badges.liveApi
                : compareState === "empty"
                  ? compareContent.badges.waiting
                  : compareContent.badges.unavailable}
            </Badge>
            {compare?.strategyId ? <Badge variant="prediction">{compare.strategyId}</Badge> : null}
          </div>
        </Card>
      </section>

      <FilterToolbar
        actions={
          <Button disabled={isPending} onClick={handleCompare} type="button">
            {isPending ? <Loader2 className="animate-spin" /> : <Scale3d />}
            {compareContent.actions.button}
          </Button>
        }
        filters={
          <>
            <div className="space-y-2 md:col-span-2 xl:col-span-4">
              <Label htmlFor="numbers">Numbers</Label>
              <Textarea
                className="min-h-28 rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]"
                id="numbers"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, numbers: event.target.value }))
                }
                value={formState.numbers}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategyId">Strategy</Label>
              <Select
                value={formState.strategyId}
                onValueChange={(strategyId) =>
                  setFormState((current) => ({
                    ...current,
                    strategyId: strategyId as CompareFormState["strategyId"]
                  }))
                }
              >
                <SelectTrigger id="strategyId">
                  <SelectValue placeholder={compareContent.selectPlaceholders.strategy} />
                </SelectTrigger>
                <SelectContent>
                  {compareContent.strategyOptions.map((strategy) => (
                    <SelectItem key={strategy.value} value={strategy.value}>
                      {strategy.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberLength">Number length</Label>
              <Input
                id="numberLength"
                min={2}
                max={6}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, numberLength: event.target.value }))
                }
                type="number"
                value={formState.numberLength}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="windowSize">Window size</Label>
              <Input
                id="windowSize"
                min={1}
                max={2000}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, windowSize: event.target.value }))
                }
                type="number"
                value={formState.windowSize}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lotteryType">Lottery type</Label>
              <Select
                value={formState.lotteryType}
                onValueChange={(lotteryType) =>
                  setFormState((current) => ({
                    ...current,
                    lotteryType: lotteryType as CompareFormState["lotteryType"]
                  }))
                }
              >
                <SelectTrigger id="lotteryType">
                  <SelectValue placeholder={compareContent.selectPlaceholders.lotteryType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THAI_GOVERNMENT">THAI_GOVERNMENT</SelectItem>
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
                    prizeType: prizeType as CompareFormState["prizeType"]
                  }))
                }
              >
                <SelectTrigger id="prizeType">
                  <SelectValue placeholder={compareContent.selectPlaceholders.prizeType} />
                </SelectTrigger>
                <SelectContent>
                  {compareContent.prizeOptions.map((prize) => (
                    <SelectItem key={prize.value} value={prize.value}>
                      {prize.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, startDate: event.target.value }))
                }
                type="date"
                value={formState.startDate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, endDate: event.target.value }))
                }
                type="date"
                value={formState.endDate}
              />
            </div>
          </>
        }
        summary={compareContent.filters.summary}
      />

      {error ? (
        <EmptyState
          description={error}
          icon={<AlertCircle />}
          title={compareContent.emptyState.fallbackTitle}
        />
      ) : null}

      {isPending ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LoadingSkeleton lines={2} />
          <LoadingSkeleton lines={2} />
          <LoadingSkeleton lines={2} />
          <LoadingSkeleton lines={2} />
        </section>
      ) : compare ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={compareContent.metrics.sampleSize}
            tone="prediction"
            value={String(compare.sampleSize)}
          />
          <MetricCard
            label={compareContent.metrics.strongestSignal}
            value={compare.strongestSignal ?? "-"}
          />
          <MetricCard
            label={compareContent.metrics.topRank}
            value={String(compare.candidates[0]?.rank ?? 0)}
          />
          <MetricCard
            label={compareContent.metrics.generated}
            value={new Date(compare.generatedAt).toLocaleDateString("th-TH")}
          />
        </section>
      ) : (
        <section>
          <EmptyState
            description={
              compareState === "error"
                ? compareContent.emptyState.fallbackDescription
                : compareContent.emptyState.emptyDescription
            }
            title={
              compareState === "error"
                ? compareContent.emptyState.fallbackTitle
                : compareContent.emptyState.emptyTitle
            }
          />
        </section>
      )}

      {compare && compare.candidates.length > 0 ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <TimeSeriesChart points={chartPoints} title={compareContent.chartTitle} />

          <Card className="p-6">
            <SectionHeading
              description={compareContent.sections.explainableRanking.description}
              eyebrow={compareContent.sections.explainableRanking.eyebrow}
              title={compareContent.sections.explainableRanking.title}
            />
            <div className="mt-4">
              <Button asChild className="px-0" variant="link">
                <Link href={compareContent.actions.methodologyHref}>
                  {compareContent.actions.rankingMethodologyLabel}
                </Link>
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              {compare.candidates.map((candidate) => (
                <div
                  className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
                  key={candidate.number}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
                      {candidate.number}
                    </p>
                    <Badge variant={candidate.rank === 1 ? "success" : "neutral"}>
                      {compareContent.badges.rankLabel} {candidate.rank}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {candidate.reasons.join(" ")}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      <Card className="p-6">
        <SectionHeading
          eyebrow={compareContent.sections.results.eyebrow}
          title={compareContent.sections.results.title}
          description={compareContent.sections.results.description}
        />

        {compare && compare.candidates.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
            <Table>
              <TableHeader className="bg-[var(--color-bg-subtle)]">
                <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {compareContent.sections.results.tableHeaders.number}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {compareContent.sections.results.tableHeaders.score}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {compareContent.sections.results.tableHeaders.rank}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {compareContent.sections.results.tableHeaders.breakdown}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {compareContent.sections.results.tableHeaders.reasons}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compare.candidates.map((candidate) => (
                  <TableRow
                    className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                    key={candidate.number}
                  >
                    <TableCell className="px-4 py-3 font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                      {candidate.number}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {candidate.score}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {candidate.rank}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(candidate.scoreBreakdown).map(([label, value]) => (
                          <Badge key={`${candidate.number}-${label}`} variant="brand">
                            {label}: {value}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                      <ul className="space-y-1">
                        {candidate.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              description={compareContent.emptyState.resultsDescription}
              title={compareContent.emptyState.resultsTitle}
            />
          </div>
        )}
      </Card>
    </main>
  );
}
