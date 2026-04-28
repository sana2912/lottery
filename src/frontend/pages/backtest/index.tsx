"use client";

import { AlertCircle, Loader2, Scale3d } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TimeSeriesChart } from "@/frontend/chart-primitives";
import { EmptyState, FilterToolbar, LoadingSkeleton, MetricCard } from "@/frontend/components";
import { backtestContent } from "@/frontend/pages/backtest/backtest.content";
import { backtestFallback, emptyHistory } from "@/frontend/pages/backtest/backtest.data";
import {
  type BacktestFormState,
  defaultBacktestFormState,
  mergeBacktestHistory,
  toBacktestChartPoints,
  toBacktestPayload
} from "@/frontend/pages/backtest/backtest.mappers";
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
  TableRow
} from "@/frontend/primitives";
import { apiGet, apiPost } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type BacktestHistoryResponse,
  type BacktestReadModel,
  backtestHistoryResponseSchema,
  backtestReadModelSchema,
  backtestRequestSchema
} from "@/schema/app/backtest.schema";

export function BacktestPage() {
  const [formState, setFormState] = useState(defaultBacktestFormState);
  const [isPending, setIsPending] = useState(false);
  const [isHistoryPending, setIsHistoryPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backtest, setBacktest] = useState<BacktestReadModel>(backtestFallback);
  const [history, setHistory] = useState<BacktestHistoryResponse>(emptyHistory);
  const [selectedRunId, setSelectedRunId] = useState<string>(backtest.run.id);

  const chartPoints = useMemo(() => toBacktestChartPoints(backtest), [backtest]);

  async function handleRunBacktest() {
    setIsPending(true);
    setError(null);

    try {
      const payload = backtestRequestSchema.parse(toBacktestPayload(formState));

      const response = await apiPost<BacktestReadModel>(apiRoutes.backtests, payload, {
        schema: backtestReadModelSchema
      });

      setBacktest(response);
      setSelectedRunId(response.run.id);
      setHistory((current) => mergeBacktestHistory(current, response));
    } catch {
      setError(backtestContent.errorMessages.runUnavailable);
      setBacktest(backtestFallback);
    } finally {
      setIsPending(false);
    }
  }

  async function handleLoadHistory() {
    setIsHistoryPending(true);

    try {
      const response = await apiGet<BacktestHistoryResponse>(apiRoutes.backtests, {
        schema: backtestHistoryResponseSchema
      });

      setHistory(response);
    } catch {
      setError(backtestContent.errorMessages.historyUnavailable);
    } finally {
      setIsHistoryPending(false);
    }
  }

  async function handleLoadRun(id: string) {
    setIsHistoryPending(true);
    setError(null);

    try {
      const response = await apiGet<BacktestReadModel>(`${apiRoutes.backtests}/${id}`, {
        schema: backtestReadModelSchema
      });

      setBacktest(response);
      setSelectedRunId(response.run.id);
    } catch {
      setError(backtestContent.errorMessages.selectedRunUnavailable);
    } finally {
      setIsHistoryPending(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--backtest)]">
            {backtestContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {backtestContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {backtestContent.hero.description}
          </p>
          <div className="mt-4">
            <Button asChild className="px-0" variant="link">
              <Link href={backtestContent.actions.methodologyHref}>
                {backtestContent.actions.methodologyLabel}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={backtestContent.sections.currentRun.eyebrow}
            title={backtestContent.sections.currentRun.title}
          />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint={backtestContent.metrics.currentHitRate.hint}
              label={backtestContent.metrics.currentHitRate.label}
              tone="backtest"
              value={`${backtest.run.hitRate}%`}
            />
            <MetricCard
              hint={backtestContent.metrics.currentMissStreak.hint}
              label={backtestContent.metrics.currentMissStreak.label}
              value={String(backtest.run.longestMissStreak)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={backtest.source === "api" ? "success" : "warning"}>
              {backtest.source === "api"
                ? backtestContent.badges.liveApi
                : backtestContent.badges.sampleRun}
            </Badge>
            <Badge variant="backtest">{backtest.run.strategyName}</Badge>
          </div>
        </Card>
      </section>

      <FilterToolbar
        actions={
          <Button disabled={isPending} onClick={handleRunBacktest} type="button">
            {isPending ? <Loader2 className="animate-spin" /> : <Scale3d />}
            {backtestContent.actions.runButton}
          </Button>
        }
        filters={
          <>
            <div className="space-y-2">
              <Label htmlFor="strategyId">Strategy</Label>
              <Select
                value={formState.strategyId}
                onValueChange={(strategyId) =>
                  setFormState((current) => ({
                    ...current,
                    strategyId: strategyId as BacktestFormState["strategyId"]
                  }))
                }
              >
                <SelectTrigger id="strategyId">
                  <SelectValue placeholder={backtestContent.selectPlaceholders.strategy} />
                </SelectTrigger>
                <SelectContent>
                  {backtestContent.strategyOptions.map((strategy) => (
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
              <Label htmlFor="candidateCount">Candidate count</Label>
              <Input
                id="candidateCount"
                min={1}
                max={20}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, candidateCount: event.target.value }))
                }
                type="number"
                value={formState.candidateCount}
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
                    lotteryType: lotteryType as BacktestFormState["lotteryType"]
                  }))
                }
              >
                <SelectTrigger id="lotteryType">
                  <SelectValue placeholder={backtestContent.selectPlaceholders.lotteryType} />
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
                    prizeType: prizeType as BacktestFormState["prizeType"]
                  }))
                }
              >
                <SelectTrigger id="prizeType">
                  <SelectValue placeholder={backtestContent.selectPlaceholders.prizeType} />
                </SelectTrigger>
                <SelectContent>
                  {backtestContent.prizeOptions.map((prize) => (
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
        summary={backtestContent.filters.summary}
      />

      {error ? (
        <EmptyState
          description={error}
          icon={<AlertCircle />}
          title={backtestContent.emptyState.fallbackTitle}
        />
      ) : null}

      {isPending ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LoadingSkeleton lines={2} />
          <LoadingSkeleton lines={2} />
          <LoadingSkeleton lines={2} />
          <LoadingSkeleton lines={2} />
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={backtestContent.metrics.coverage}
            tone="backtest"
            value={String(backtest.run.coverage)}
          />
          <MetricCard
            label={backtestContent.metrics.candidates}
            value={String(backtest.run.candidateCount)}
          />
          <MetricCard
            label={backtestContent.metrics.averageHitRank}
            value={backtest.run.averageHitRank ? backtest.run.averageHitRank.toString() : "-"}
          />
          <MetricCard
            label={backtestContent.metrics.computed}
            value={new Date(backtest.run.computedAt).toLocaleDateString("th-TH")}
          />
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <TimeSeriesChart points={chartPoints} title={backtestContent.chartTitle} />

        <Card className="p-6">
          <SectionHeading
            eyebrow={backtestContent.sections.runDetails.eyebrow}
            title={backtestContent.sections.runDetails.title}
            description={backtestContent.sections.runDetails.description}
          />
          <div className="mt-4">
            <Button asChild className="px-0" variant="link">
              <Link href={backtestContent.actions.methodologyHref}>
                {backtestContent.actions.resultsMethodologyLabel}
              </Link>
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            <MetricCard
              hint={backtestContent.metrics.strategy.hint}
              label={backtestContent.metrics.strategy.label}
              value={backtest.run.strategyName}
            />
            <MetricCard
              hint={backtestContent.metrics.engineVersion.hint}
              label={backtestContent.metrics.engineVersion.label}
              value={backtest.run.version}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="backtest">{backtest.run.prizeType}</Badge>
            <Badge variant="neutral">{backtest.run.numberLength}-digit</Badge>
            <Badge variant="brand">{backtest.run.lotteryType}</Badge>
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow={backtestContent.history.eyebrow}
          title={backtestContent.history.title}
          description={backtestContent.history.description}
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            disabled={isHistoryPending}
            onClick={handleLoadHistory}
            type="button"
            variant="secondary"
          >
            {isHistoryPending ? <Loader2 className="animate-spin" /> : <Scale3d />}
            {backtestContent.actions.historyButton}
          </Button>
          <Badge variant="neutral">
            {history.items.length} {backtestContent.history.storedRunsLabel}
          </Badge>
        </div>

        {history.items.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              description={backtestContent.emptyState.historyDescription}
              title={backtestContent.emptyState.historyTitle}
            />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
            <Table>
              <TableHeader className="bg-[var(--color-bg-subtle)]">
                <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {backtestContent.history.tableHeaders.computed}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {backtestContent.history.tableHeaders.strategy}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {backtestContent.history.tableHeaders.hitRate}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {backtestContent.history.tableHeaders.coverage}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    {backtestContent.history.tableHeaders.action}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.items.map((item) => (
                  <TableRow
                    className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                    key={item.id}
                  >
                    <TableCell className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                      {new Date(item.computedAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {item.strategyName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {item.hitRate}%
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {item.coverage}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        disabled={isHistoryPending || selectedRunId === item.id}
                        onClick={() => handleLoadRun(item.id)}
                        type="button"
                        variant={selectedRunId === item.id ? "secondary" : "ghost"}
                      >
                        {selectedRunId === item.id
                          ? backtestContent.actions.viewingLabel
                          : backtestContent.actions.loadLabel}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <SectionHeading
          eyebrow={backtestContent.results.eyebrow}
          title={backtestContent.results.title}
          description={backtestContent.results.description}
        />

        <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
          <Table>
            <TableHeader className="bg-[var(--color-bg-subtle)]">
              <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {backtestContent.results.tableHeaders.draw}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {backtestContent.results.tableHeaders.generated}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {backtestContent.results.tableHeaders.actual}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {backtestContent.results.tableHeaders.status}
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  {backtestContent.results.tableHeaders.hitRank}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backtest.results.map((result) => (
                <TableRow
                  className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                  key={result.id}
                >
                  <TableCell className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                    {new Date(result.drawDate).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-sm text-[var(--color-text-secondary)]">
                    {result.generatedNumbers.join(", ")}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-sm text-[var(--color-text-secondary)]">
                    {result.actualNumbers.join(", ")}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={result.isHit ? "success" : "danger"}>
                      {result.isHit
                        ? backtestContent.results.statusLabels.hit
                        : backtestContent.results.statusLabels.miss}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {result.rankOfHit ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </main>
  );
}
