"use client";

import { AlertCircle, Loader2, Scale3d } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TimeSeriesChart } from "@/frontend/chart-primitives";
import { EmptyState, FilterToolbar, LoadingSkeleton, MetricCard } from "@/frontend/components";
import { backtestContent } from "@/frontend/pages/backtest/backtest.content";
import {
  emptyHistory,
  getBacktestHistory,
  getBacktestRun,
  getLatestBacktestPageData,
  runBacktestRequest
} from "@/frontend/pages/backtest/backtest.data";
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
import {
  type BacktestHistoryResponse,
  type BacktestReadModel,
  backtestRequestSchema
} from "@/schema/app/backtest.schema";

export function BacktestPage() {
  const [formState, setFormState] = useState(defaultBacktestFormState);
  const [runState, setRunState] = useState<"empty" | "error" | "loading" | "ready">("loading");
  const [historyState, setHistoryState] = useState<"error" | "loading" | "ready">("loading");
  const [isPending, setIsPending] = useState(false);
  const [isHistoryPending, setIsHistoryPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backtest, setBacktest] = useState<BacktestReadModel | null>(null);
  const [history, setHistory] = useState<BacktestHistoryResponse>(emptyHistory);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const chartPoints = useMemo(() => (backtest ? toBacktestChartPoints(backtest) : []), [backtest]);

  const loadInitialBacktestData = useCallback(async () => {
    try {
      const { backtest: latestRun, history: nextHistory } = await getLatestBacktestPageData();

      setHistory(nextHistory);
      setHistoryState("ready");

      if (!latestRun) {
        setBacktest(null);
        setSelectedRunId(null);
        setRunState("empty");
        return;
      }

      setBacktest(latestRun);
      setSelectedRunId(latestRun.run.id);
      setRunState("ready");
    } catch {
      setBacktest(null);
      setHistory(emptyHistory);
      setSelectedRunId(null);
      setHistoryState("error");
      setRunState("error");
      setError(backtestContent.errorMessages.initialUnavailable);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadInitialBacktestData();
    });
  }, [loadInitialBacktestData]);

  async function handleRunBacktest() {
    setIsPending(true);
    setError(null);

    try {
      const payload = backtestRequestSchema.parse(toBacktestPayload(formState));
      const response = await runBacktestRequest(payload);

      setBacktest(response);
      setRunState("ready");
      setSelectedRunId(response.run.id);
      setHistoryState("ready");
      setHistory((current) => mergeBacktestHistory(current, response));
    } catch {
      setError(backtestContent.errorMessages.runUnavailable);
      setRunState(backtest ? "ready" : "error");
    } finally {
      setIsPending(false);
    }
  }

  async function handleLoadHistory() {
    setIsHistoryPending(true);
    setHistoryState("loading");
    setError(null);

    try {
      setHistory(await getBacktestHistory());
      setHistoryState("ready");
    } catch {
      setHistoryState("error");
      setError(backtestContent.errorMessages.historyUnavailable);
    } finally {
      setIsHistoryPending(false);
    }
  }

  async function handleLoadRun(id: string) {
    setIsHistoryPending(true);
    setError(null);

    try {
      const response = await getBacktestRun(id);

      setBacktest(response);
      setRunState("ready");
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
              value={backtest ? `${backtest.run.hitRate}%` : "-"}
            />
            <MetricCard
              hint={backtestContent.metrics.currentMissStreak.hint}
              label={backtestContent.metrics.currentMissStreak.label}
              value={backtest ? String(backtest.run.longestMissStreak) : "-"}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={runState === "ready" ? "success" : "warning"}>
              {runState === "ready"
                ? backtestContent.badges.liveApi
                : runState === "empty"
                  ? backtestContent.badges.noRun
                  : backtestContent.badges.unavailable}
            </Badge>
            {backtest ? <Badge variant="backtest">{backtest.run.strategyName}</Badge> : null}
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
                max={6}
                min={2}
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
                max={20}
                min={1}
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
                max={2000}
                min={1}
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

      {isPending || runState === "loading" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LoadingSkeleton lines={2} />
          <LoadingSkeleton lines={2} />
          <LoadingSkeleton lines={2} />
          <LoadingSkeleton lines={2} />
        </section>
      ) : backtest ? (
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
      ) : (
        <section>
          <EmptyState
            description={
              runState === "empty"
                ? backtestContent.emptyState.currentRunDescription
                : backtestContent.emptyState.fallbackDescription
            }
            title={
              runState === "empty"
                ? backtestContent.emptyState.currentRunTitle
                : backtestContent.emptyState.fallbackTitle
            }
          />
        </section>
      )}

      {backtest ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <TimeSeriesChart points={chartPoints} title={backtestContent.chartTitle} />

          <Card className="p-6">
            <SectionHeading
              description={backtestContent.sections.runDetails.description}
              eyebrow={backtestContent.sections.runDetails.eyebrow}
              title={backtestContent.sections.runDetails.title}
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
      ) : null}

      <Card className="p-6">
        <SectionHeading
          description={backtestContent.history.description}
          eyebrow={backtestContent.history.eyebrow}
          title={backtestContent.history.title}
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

        {historyState === "loading" && runState === "loading" ? (
          <div className="mt-5 grid gap-3">
            <LoadingSkeleton lines={2} />
            <LoadingSkeleton lines={2} />
          </div>
        ) : historyState === "error" ? (
          <div className="mt-5">
            <EmptyState
              description={backtestContent.emptyState.historyUnavailableDescription}
              title={backtestContent.emptyState.historyUnavailableTitle}
            />
          </div>
        ) : history.items.length === 0 ? (
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
          description={backtestContent.results.description}
          eyebrow={backtestContent.results.eyebrow}
          title={backtestContent.results.title}
        />

        {backtest && backtest.results.length > 0 ? (
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
        ) : (
          <div className="mt-5">
            <EmptyState
              description={backtestContent.emptyState.resultsDescription}
              title={backtestContent.emptyState.resultsTitle}
            />
          </div>
        )}
      </Card>
    </main>
  );
}
