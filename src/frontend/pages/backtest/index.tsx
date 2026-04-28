"use client";

import { AlertCircle, Loader2, Scale3d } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TimeSeriesChart } from "@/frontend/chart-primitives";
import { EmptyState, FilterToolbar, LoadingSkeleton, MetricCard } from "@/frontend/components";
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
  type BacktestRequest,
  backtestHistoryResponseSchema,
  backtestReadModelSchema,
  backtestRequestSchema
} from "@/schema/app/backtest.schema";

const strategyOptions = [
  { label: "Balanced", value: "balanced" },
  { label: "Hot trend", value: "hotTrend" },
  { label: "Cold rebound", value: "coldRebound" }
] as const;

const prizeOptions = [
  { label: "Two digit", value: "TWO_DIGIT" },
  { label: "First", value: "FIRST" },
  { label: "Three front", value: "THREE_FRONT" },
  { label: "Three back", value: "THREE_BACK" }
] as const;

type BacktestFormState = {
  candidateCount: string;
  endDate: string;
  lotteryType: BacktestRequest["lotteryType"];
  numberLength: string;
  prizeType: BacktestRequest["prizeType"];
  startDate: string;
  strategyId: BacktestRequest["strategyId"];
  windowSize: string;
};

const defaultFormState: BacktestFormState = {
  candidateCount: "5",
  endDate: "2026-04-16",
  lotteryType: "THAI_GOVERNMENT",
  numberLength: "2",
  prizeType: "TWO_DIGIT",
  startDate: "2025-01-01",
  strategyId: "balanced",
  windowSize: "120"
};

const backtestFallback = backtestReadModelSchema.parse({
  generatedAt: "2026-04-28T00:00:00.000Z",
  results: [
    {
      actualNumbers: ["47"],
      drawDate: "2026-04-16T00:00:00.000Z",
      drawId: "draw-2026-04-16",
      generatedNumbers: ["47", "91", "24"],
      hitNumbers: ["47"],
      id: "backtest-result-2026-04-16",
      isHit: true,
      rankOfHit: 1,
      runId: "backtest-run-balanced-001"
    },
    {
      actualNumbers: ["18"],
      drawDate: "2026-04-01T00:00:00.000Z",
      drawId: "draw-2026-04-01",
      generatedNumbers: ["03", "74", "29"],
      hitNumbers: [],
      id: "backtest-result-2026-04-01",
      isHit: false,
      runId: "backtest-run-balanced-001"
    }
  ],
  run: {
    averageHitRank: 1,
    candidateCount: 5,
    computedAt: "2026-04-28T00:00:00.000Z",
    coverage: 24,
    endDrawDate: "2026-04-16T00:00:00.000Z",
    hitRate: 50,
    id: "backtest-run-balanced-001",
    longestMissStreak: 1,
    lotteryType: "THAI_GOVERNMENT",
    numberLength: 2,
    params: {
      windowSize: 120
    },
    prizeType: "TWO_DIGIT",
    startDrawDate: "2025-01-01T00:00:00.000Z",
    strategyId: "balanced",
    strategyName: "Balanced",
    version: "prediction-engine-v1"
  },
  source: "mock"
});

const emptyHistory = backtestHistoryResponseSchema.parse({
  generatedAt: "2026-04-28T00:00:00.000Z",
  items: [],
  source: "api"
});

export function BacktestPage() {
  const [formState, setFormState] = useState(defaultFormState);
  const [isPending, setIsPending] = useState(false);
  const [isHistoryPending, setIsHistoryPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backtest, setBacktest] = useState<BacktestReadModel>(backtestFallback);
  const [history, setHistory] = useState<BacktestHistoryResponse>(emptyHistory);
  const [selectedRunId, setSelectedRunId] = useState<string>(backtest.run.id);

  const chartPoints = useMemo(
    () =>
      backtest.results.map((result, index) => ({
        id: result.id,
        label: `${index + 1}`,
        value: result.isHit ? 100 : Math.max(15, 30 - (result.rankOfHit ?? 0) * 5)
      })),
    [backtest.results]
  );

  async function handleRunBacktest() {
    setIsPending(true);
    setError(null);

    try {
      const payload = backtestRequestSchema.parse({
        candidateCount: formState.candidateCount,
        endDate: formState.endDate || undefined,
        lotteryType: formState.lotteryType,
        numberLength: formState.numberLength,
        params: {
          windowSize: formState.windowSize
        },
        prizeType: formState.prizeType,
        startDate: formState.startDate || undefined,
        strategyId: formState.strategyId,
        windowSize: formState.windowSize
      });

      const response = await apiPost<BacktestReadModel>(apiRoutes.backtests, payload, {
        schema: backtestReadModelSchema
      });

      setBacktest(response);
      setSelectedRunId(response.run.id);
      setHistory((current) => ({
        ...current,
        items: [
          {
            candidateCount: response.run.candidateCount,
            computedAt: response.run.computedAt,
            coverage: response.run.coverage,
            hitRate: response.run.hitRate,
            id: response.run.id,
            longestMissStreak: response.run.longestMissStreak,
            lotteryType: response.run.lotteryType,
            numberLength: response.run.numberLength,
            prizeType: response.run.prizeType,
            strategyId: response.run.strategyId,
            strategyName: response.run.strategyName,
            version: response.run.version
          },
          ...current.items.filter((item) => item.id !== response.run.id)
        ].slice(0, 8)
      }));
    } catch {
      setError(
        "Backtest API is not available yet, so this view is showing the checked sample run."
      );
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
      setError("Backtest history is not available yet, so recent persisted runs cannot be loaded.");
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
      setError("Unable to load the selected persisted backtest run.");
    } finally {
      setIsHistoryPending(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--backtest)]">
            Backtest
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            Walk-forward strategy validation
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            Historical draws are replayed in order so the selected strategy only sees earlier data.
            Hit rate, miss streak, and ranking are shown as analysis output, not guarantees.
          </p>
          <div className="mt-4">
            <Button asChild className="px-0" variant="link">
              <Link href="/methodology#backtest-reading">
                Read how walk-forward backtest is interpreted
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Run summary" title="Current backtest" />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint="Share of historical windows that produced at least one hit."
              label="Hit rate"
              tone="backtest"
              value={`${backtest.run.hitRate}%`}
            />
            <MetricCard
              hint="Longest consecutive miss streak in the sampled run."
              label="Miss streak"
              value={String(backtest.run.longestMissStreak)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={backtest.source === "api" ? "success" : "warning"}>
              {backtest.source === "api" ? "Live API" : "Sample run"}
            </Badge>
            <Badge variant="backtest">{backtest.run.strategyName}</Badge>
          </div>
        </Card>
      </section>

      <FilterToolbar
        actions={
          <Button disabled={isPending} onClick={handleRunBacktest} type="button">
            {isPending ? <Loader2 className="animate-spin" /> : <Scale3d />}
            Run backtest
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
                  <SelectValue placeholder="Lottery type" />
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
                  <SelectValue placeholder="Prize type" />
                </SelectTrigger>
                <SelectContent>
                  {prizeOptions.map((prize) => (
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
        summary="The backtest runs against historical draws only. The selected window never looks forward into the target draw."
      />

      {error ? (
        <EmptyState description={error} icon={<AlertCircle />} title="Backtest API fallback" />
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
          <MetricCard label="Coverage" tone="backtest" value={String(backtest.run.coverage)} />
          <MetricCard label="Candidates" value={String(backtest.run.candidateCount)} />
          <MetricCard
            label="Average hit rank"
            value={backtest.run.averageHitRank ? backtest.run.averageHitRank.toString() : "-"}
          />
          <MetricCard
            label="Computed"
            value={new Date(backtest.run.computedAt).toLocaleDateString("th-TH")}
          />
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <TimeSeriesChart points={chartPoints} title="Hit sequence" />

        <Card className="p-6">
          <SectionHeading
            eyebrow="Run details"
            title="Summary and verification"
            description="The contract exposes versioned scores so the UI can verify which engine produced the run."
          />
          <div className="mt-4">
            <Button asChild className="px-0" variant="link">
              <Link href="/methodology#backtest-reading">
                Review hit rate, miss streak, and rank guidance
              </Link>
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            <MetricCard
              hint="Strategy registry entry used for scoring."
              label="Strategy"
              value={backtest.run.strategyName}
            />
            <MetricCard
              hint="Prediction engine version recorded in the backtest run."
              label="Engine version"
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
          eyebrow="History"
          title="Recent persisted runs"
          description="Load a previously saved run from PostgreSQL to compare its summary and result table."
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            disabled={isHistoryPending}
            onClick={handleLoadHistory}
            type="button"
            variant="secondary"
          >
            {isHistoryPending ? <Loader2 className="animate-spin" /> : <Scale3d />}
            Load recent runs
          </Button>
          <Badge variant="neutral">{history.items.length} stored runs</Badge>
        </div>

        {history.items.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              description="Run a backtest first, then load recent runs to reuse persisted results."
              title="No stored history loaded"
            />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
            <Table>
              <TableHeader className="bg-[var(--color-bg-subtle)]">
                <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    Computed
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    Strategy
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    Hit rate
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    Coverage
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                    Action
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
                        {selectedRunId === item.id ? "Viewing" : "Load"}
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
          eyebrow="Results"
          title="Walk-forward outcomes"
          description="Each row reflects one target draw evaluated from the earlier window only."
        />

        <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
          <Table>
            <TableHeader className="bg-[var(--color-bg-subtle)]">
              <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Draw
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Generated
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Actual
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Hit rank
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
                      {result.isHit ? "Hit" : "Miss"}
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
