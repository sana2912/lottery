"use client";

import { AlertCircle, Loader2, Scale3d } from "lucide-react";
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
  TableRow,
  Textarea
} from "@/frontend/primitives";
import { apiPost } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type CompareReadModel,
  type CompareRequest,
  compareReadModelSchema,
  compareRequestSchema
} from "@/schema/app/compare.schema";

const strategyOptions = [
  { label: "Balanced", value: "balanced" },
  { label: "Hot trend", value: "hotTrend" },
  { label: "Cold rebound", value: "coldRebound" }
] as const;

const compareFallback = compareReadModelSchema.parse({
  candidates: [
    {
      number: "47",
      numberLength: 2,
      rank: 1,
      reasons: ["Hot trend is strong in the sampled window.", "Position support remains stable."],
      score: 82,
      scoreBreakdown: {
        hot: 30,
        overdue: 12,
        pair: 10,
        pattern: 6,
        position: 24
      }
    },
    {
      number: "91",
      numberLength: 2,
      rank: 2,
      reasons: ["Overdue gap is elevated.", "Pair support is moderate."],
      score: 68,
      scoreBreakdown: {
        hot: 14,
        overdue: 26,
        pair: 8,
        pattern: 4,
        position: 16
      }
    }
  ],
  generatedAt: "2026-04-28T00:00:00.000Z",
  sampleSize: 24,
  source: "mock",
  strongestSignal: "hot"
});

type CompareFormState = {
  endDate: string;
  lotteryType: CompareRequest["lotteryType"];
  numberLength: string;
  numbers: string;
  prizeType: CompareRequest["prizeType"];
  startDate: string;
  strategyId: CompareRequest["strategyId"];
  windowSize: string;
};

const defaultFormState: CompareFormState = {
  endDate: "2026-04-16",
  lotteryType: "THAI_GOVERNMENT",
  numberLength: "2",
  numbers: "47, 91, 24, 03, 18",
  prizeType: "TWO_DIGIT",
  startDate: "2025-01-01",
  strategyId: "balanced",
  windowSize: "120"
};

export function ComparePage() {
  const [formState, setFormState] = useState(defaultFormState);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState<CompareReadModel>(compareFallback);

  const chartPoints = useMemo(
    () =>
      compare.candidates.map((candidate) => ({
        id: candidate.number,
        label: candidate.number,
        value: candidate.score
      })),
    [compare.candidates]
  );

  async function handleCompare() {
    setIsPending(true);
    setError(null);

    try {
      const numbers = formState.numbers
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean);

      const payload = compareRequestSchema.parse({
        endDate: formState.endDate || undefined,
        lotteryType: formState.lotteryType,
        numberLength: formState.numberLength,
        numbers,
        prizeType: formState.prizeType,
        startDate: formState.startDate || undefined,
        strategyId: formState.strategyId,
        windowSize: formState.windowSize
      });

      const response = await apiPost<CompareReadModel>(apiRoutes.compare, payload, {
        schema: compareReadModelSchema
      });

      setCompare(response);
    } catch {
      setError("Compare API is not available yet, so this view is showing the checked sample set.");
      setCompare(compareFallback);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--prediction)]">
            Compare
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            Side-by-side number scoring
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            Compare ranks candidate numbers against the same historical analytics signals so the
            strongest score is easy to inspect. The output explains historical support, not a win
            guarantee.
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Run summary" title="Current compare" />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint="Highest score in the current candidate set."
              label="Top score"
              tone="prediction"
              value={String(compare.candidates[0]?.score ?? 0)}
            />
            <MetricCard
              hint="How many candidate numbers were compared."
              label="Candidates"
              value={String(compare.candidates.length)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={compare.source === "api" ? "success" : "warning"}>
              {compare.source === "api" ? "Live API" : "Sample set"}
            </Badge>
            {compare.strategyId ? <Badge variant="prediction">{compare.strategyId}</Badge> : null}
          </div>
        </Card>
      </section>

      <FilterToolbar
        actions={
          <Button disabled={isPending} onClick={handleCompare} type="button">
            {isPending ? <Loader2 className="animate-spin" /> : <Scale3d />}
            Compare numbers
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
                    prizeType: prizeType as CompareFormState["prizeType"]
                  }))
                }
              >
                <SelectTrigger id="prizeType">
                  <SelectValue placeholder="Prize type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWO_DIGIT">TWO_DIGIT</SelectItem>
                  <SelectItem value="FIRST">FIRST</SelectItem>
                  <SelectItem value="THREE_FRONT">THREE_FRONT</SelectItem>
                  <SelectItem value="THREE_BACK">THREE_BACK</SelectItem>
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
        summary="Compare uses the same scoring engine as Prediction Lab, so the result is aligned with one contract across the product."
      />

      {error ? (
        <EmptyState description={error} icon={<AlertCircle />} title="Compare API fallback" />
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
          <MetricCard label="Sample size" tone="prediction" value={String(compare.sampleSize)} />
          <MetricCard label="Strongest signal" value={compare.strongestSignal ?? "-"} />
          <MetricCard label="Top rank" value={String(compare.candidates[0]?.rank ?? 0)} />
          <MetricCard
            label="Generated"
            value={new Date(compare.generatedAt).toLocaleDateString("th-TH")}
          />
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <TimeSeriesChart points={chartPoints} title="Score comparison" />

        <Card className="p-6">
          <SectionHeading
            eyebrow="Explainable ranking"
            title="Why the leading numbers scored higher"
            description="The score breakdown keeps the output readable for product review and later strategy tuning."
          />
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
                    Rank {candidate.rank}
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

      <Card className="p-6">
        <SectionHeading
          eyebrow="Table"
          title="Compare results"
          description="The table exposes each score breakdown so the same scoring model can be audited across candidates."
        />

        <div className="mt-5 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
          <Table>
            <TableHeader className="bg-[var(--color-bg-subtle)]">
              <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Number
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Score
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Rank
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Breakdown
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                  Reasons
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
      </Card>
    </main>
  );
}
