import { AlertTriangle, BookOpen, CalendarDays, FlaskConical, Scale3d } from "lucide-react";
import Link from "next/link";
import { Badge, Button, Card, SectionHeading } from "@/frontend/primitives";

const scoreBreakdownRows = [
  {
    id: "hot",
    label: "Hot",
    note: "Rewards numbers that appear more frequently inside the selected historical window.",
    variant: "hot" as const
  },
  {
    id: "overdue",
    label: "Overdue",
    note: "Rewards numbers that have stayed absent for longer than their recent baseline.",
    variant: "overdue" as const
  },
  {
    id: "position",
    label: "Position",
    note: "Reflects trend support from the underlying frequency and recency calculations.",
    variant: "brand" as const
  },
  {
    id: "pattern",
    label: "Pattern",
    note: "Adds weight when the number matches tracked pattern flags such as odd, high, or double.",
    variant: "prediction" as const
  },
  {
    id: "pair",
    label: "Pair",
    note: "Adds weight for repeated-digit or pair structure that the selected strategy values.",
    variant: "backtest" as const
  }
] as const;

const glossaryItems = [
  {
    term: "Window size",
    detail:
      "How many historical draws are visible to analytics, compare, prediction, and backtest runs."
  },
  {
    term: "Sample size",
    detail:
      "How many eligible historical rows contributed to a summary, comparison, or month insight."
  },
  {
    term: "Hit rate",
    detail:
      "Share of evaluated draws where a generated set contained at least one actual winning number."
  },
  {
    term: "Longest miss streak",
    detail:
      "Largest run of consecutive evaluated draws with no hit inside the generated candidate set."
  }
] as const;

const pageLinks = [
  { href: "#prediction-score", label: "Prediction score" },
  { href: "#score-breakdown", label: "Score breakdown" },
  { href: "#backtest-reading", label: "Backtest reading guide" },
  { href: "#monthly-insights", label: "Monthly insights" },
  { href: "#limitations", label: "Limits and disclaimers" }
] as const;

export function MethodologyPage() {
  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--methodology)]">
            Methodology
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            How this dashboard turns history into explainable signals
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            This page explains how scores, seasonal notes, and backtest summaries are derived so the
            product stays readable and auditable. Every metric here should be interpreted as
            historical analysis, not a promise about a future draw.
          </p>
          <div className="mt-5 rounded-none bg-[var(--warning-soft)] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 text-[var(--warning)]" />
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                Scores rank historical support inside a chosen context. They do not estimate true
                winning probability and they do not remove chance from lottery outcomes.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow="Quick links"
            title="Jump to a topic"
            description="Use the same sections linked from Prediction Lab, Backtest, Compare, and Calendar."
          />
          <div className="mt-5 flex flex-col items-start gap-2">
            {pageLinks.map((item) => (
              <Button asChild key={item.href} size="sm" variant="link">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow="Glossary"
          title="Core terms used across the MVP"
          description="These terms appear repeatedly in filters, score cards, and tables."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {glossaryItems.map((item) => (
            <div
              className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
              key={item.term}
            >
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.term}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6" id="prediction-score">
        <SectionHeading
          eyebrow="Prediction"
          title="How to read Prediction Lab output"
          description="Prediction Lab reuses analytics number stats and applies a selected strategy weight profile."
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <div className="rounded-none bg-[var(--methodology-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                Flow
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Results history becomes analytics stats. A strategy then weights those stats into a
                single score and emits reasons so each candidate remains inspectable.
              </p>
            </div>
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                Example
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                A number can rank highly because it is both frequent in the selected window and
                overdue relative to its recent absence, while another number can lead mainly because
                a strategy favors hot trend over gap recovery.
              </p>
            </div>
          </div>
          <div className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-[var(--prediction)]" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Interpretation rule
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              Higher score means stronger support inside the selected historical context. It does
              not mean the number is expected to win in the next draw.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6" id="score-breakdown">
        <SectionHeading
          eyebrow="Scoring"
          title="Score breakdown fields"
          description="Prediction Lab and Compare share the same scoring contract, so these labels mean the same thing in both pages."
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
          {scoreBreakdownRows.map((row) => (
            <div
              className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
              key={row.id}
            >
              <Badge variant={row.variant}>{row.label}</Badge>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                {row.note}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6" id="backtest-reading">
        <SectionHeading
          eyebrow="Backtest"
          title="How to read walk-forward backtest results"
          description="Backtest replays draws in chronological order so each target draw only sees earlier data."
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                Walk-forward rule
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                For each evaluated draw, the engine slices a historical window that ends before the
                target draw. That prevents data leakage from future outcomes.
              </p>
            </div>
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                What matters most
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Read hit rate together with coverage and longest miss streak. A run with a moderate
                hit rate but a severe miss streak can still be difficult to trust operationally.
              </p>
            </div>
          </div>
          <div className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4">
            <div className="flex items-center gap-2">
              <Scale3d className="size-4 text-[var(--backtest)]" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Hit rate versus rank
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              Hit rate answers whether a generated set included an actual hit. Average hit rank
              answers how early that hit appeared inside the candidate ordering. They measure
              different qualities and should not be merged into one conclusion.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6" id="monthly-insights">
        <SectionHeading
          eyebrow="Calendar"
          title="How monthly insights should be read"
          description="Monthly insight cards summarize historical draws from the same month only."
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                Sample-size rule
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                A monthly pattern with 10 or 12 rows is descriptive context only. Small samples can
                swing quickly and should not be treated as stable evidence.
              </p>
            </div>
            <div className="rounded-none bg-[var(--muted-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                Scope rule
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Hot and cold numbers in Calendar are seasonality hints. They are not direct
                substitutes for the main analytics views, which use broader configurable windows.
              </p>
            </div>
          </div>
          <div className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-[var(--primary)]" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Recommended use
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              Use Calendar to frame timing and seasonality, then confirm numbers through Analytics,
              Compare, or Backtest instead of reading the monthly card alone.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6" id="limitations">
        <SectionHeading
          eyebrow="Limits"
          title="What this MVP does not claim"
          description="These boundaries should stay visible wherever scores or seasonality are shown."
        />
        <div className="mt-5 space-y-3">
          <div className="rounded-none bg-[var(--warning-soft)] p-4">
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              The dashboard does not estimate true winning odds and does not guarantee future
              outcomes.
            </p>
          </div>
          <div className="rounded-none bg-[var(--warning-soft)] p-4">
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              Strategy scores depend on the chosen prize type, number length, date range, and window
              size. Changing context can change ranking materially.
            </p>
          </div>
          <div className="rounded-none bg-[var(--warning-soft)] p-4">
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              Historical patterns can disappear. Use this product as a research aid, not as evidence
              that chance has been removed from the lottery.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Button asChild variant="link">
            <Link href="#prediction-score">
              <BookOpen />
              Revisit the score sections
            </Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
