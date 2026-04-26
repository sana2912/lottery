import {
  Activity,
  ArrowRight,
  BarChart3,
  BookmarkCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Scale,
  Search,
  Shapes,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import homeMock from "@/frontend/pages/home/home.mock.json";
import { Badge, Button } from "@/frontend/primitives";

const featureIconMap = {
  dashboard: LayoutDashboard,
  results: Search,
  analytics: BarChart3,
  patterns: Shapes,
  prediction: FlaskConical,
  backtest: Gauge,
  watchlist: BookmarkCheck,
  compare: Scale,
  calendar: CalendarDays,
  methodology: BookOpen
} as const;

function ProductPreview() {
  const preview = homeMock.hero.preview;
  const highestTrendValue = Math.max(...preview.trendValues);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-6 right-4 hidden w-[640px] lg:block xl:right-10"
    >
      <div className="absolute inset-0 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] shadow-[var(--shadow-card)]" />
      <div className="absolute left-8 top-8 w-[330px] rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0] text-[var(--color-text-muted)]">
            {preview.status}
          </span>
          <span className="rounded-[var(--radius-badge)] bg-[var(--color-bg-success-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-text-success)]">
            {preview.readyLabel}
          </span>
        </div>
        <p className="mt-5 text-sm font-medium text-[var(--color-text-secondary)]">
          {preview.latestDrawLabel}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-[0] text-[var(--color-text-primary)]">
          {preview.latestDraw}
        </p>
        <div className="mt-5 grid grid-cols-[120px_minmax(0,1fr)] gap-4">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-bg-brand-soft)] p-4">
            <p className="text-xs font-semibold text-[var(--color-brand-outline)]">
              {preview.highlightLabel}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-[0] text-[var(--color-brand)]">
              {preview.highlightNumber}
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4">
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
              {preview.scoreLabel}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-[0] text-[var(--color-text-primary)]">
              {preview.score}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-8 w-[360px] rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {preview.trendLabel}
          </span>
          <TrendingUp className="size-4 text-[var(--color-brand)]" />
        </div>
        <div className="mt-5 flex h-24 items-end gap-3">
          {preview.trendValues.map((value) => (
            <div
              className="min-h-4 flex-1 rounded-t-[var(--radius-badge)] bg-[var(--color-brand)]"
              key={value}
              style={{ height: `${(value / highestTrendValue) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-4">
          <span className="text-sm text-[var(--color-text-secondary)]">
            {preview.watchlistLabel}
          </span>
          <span className="text-xl font-bold tracking-[0] text-[var(--color-text-primary)]">
            {preview.watchlistCount}
          </span>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border-soft)] bg-[var(--color-bg-frosted)] px-4 py-4 backdrop-blur md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white shadow-[var(--shadow-micro)]">
              <Sparkles className="size-5" />
            </span>
            <span className="text-base font-bold tracking-[0] text-[var(--color-text-primary)]">
              {homeMock.navigation.brand}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {homeMock.navigation.links.map((link) => (
              <Link
                className="rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Button
            asChild
            className="rounded-[var(--radius-control)] bg-[var(--color-brand)] px-4 py-[13px] text-white hover:bg-[var(--color-brand-strong)]"
          >
            <Link href={homeMock.navigation.cta.href}>{homeMock.navigation.cta.label}</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)]">
        <ProductPreview />
        <div className="absolute inset-0 bg-[rgba(255,255,255,0.9)] lg:bg-[rgba(255,255,255,0.68)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-[72px] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <Badge variant="brand">{homeMock.hero.eyebrow}</Badge>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-[0] text-[var(--color-text-primary)] md:text-5xl">
              {homeMock.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] md:text-lg">
              {homeMock.hero.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="rounded-[var(--radius-control)] bg-[var(--color-brand)] px-4 py-[13px] text-white hover:bg-[var(--color-brand-strong)]"
              >
                <Link href={homeMock.hero.primaryAction.href}>
                  {homeMock.hero.primaryAction.label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="rounded-[var(--radius-control)] border-[var(--color-brand-outline)] bg-[var(--color-bg-canvas)] px-4 py-[13px] text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
                variant="outline"
              >
                <Link href={homeMock.hero.secondaryAction.href}>
                  {homeMock.hero.secondaryAction.label}
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {homeMock.metrics.map((metric) => (
              <div
                className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-card)]"
                key={metric.label}
              >
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-bold tracking-[0] text-[var(--color-text-primary)]">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {metric.hint}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-border-soft)] px-4 py-12 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0] text-[var(--color-text-muted)]">
                {homeMock.featureSection.eyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[0] text-[var(--color-text-primary)]">
                {homeMock.featureSection.title}
              </h2>
            </div>
            <Button
              asChild
              className="rounded-[var(--radius-control)] bg-[var(--color-bg-brand-soft)] px-4 py-[13px] text-[var(--color-brand)] hover:bg-[var(--color-bg-brand-soft-strong)]"
              variant="ghost"
            >
              <Link href={homeMock.featureSection.actionHref}>
                {homeMock.featureSection.actionLabel}
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {homeMock.features.map((feature) => {
              const Icon = featureIconMap[feature.icon as keyof typeof featureIconMap] ?? Activity;

              return (
                <Link
                  className="group flex min-h-[230px] flex-col rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--color-brand-outline)]"
                  href={feature.href}
                  key={feature.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-bg-brand-soft)] text-[var(--color-brand)]">
                      <Icon className="size-5" />
                    </span>
                    <Badge variant="neutral">{feature.status}</Badge>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-[0] text-[var(--color-text-primary)]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {feature.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand)]">
                    {homeMock.featureSection.itemActionLabel}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-bg-canvas)] px-4 py-12 md:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4 md:grid-cols-3">
            {homeMock.workflow.map((item) => (
              <div
                className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5"
                key={item.step}
              >
                <p className="text-xs font-bold uppercase tracking-[0] text-[var(--color-brand-outline)]">
                  {item.step}
                </p>
                <h3 className="mt-4 text-lg font-semibold tracking-[0] text-[var(--color-text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <aside className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-bg-dark)] p-6 text-[var(--color-text-inverse)] shadow-[var(--shadow-card)]">
            <div className="flex size-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-bg-dark-softer)]">
              <ShieldCheck className="size-5" />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0] text-[var(--color-text-inverse-muted)]">
              {homeMock.trustPanel.label}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[0]">{homeMock.trustPanel.title}</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-text-inverse-soft)]">
              {homeMock.trustPanel.description}
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-[var(--color-border-inverse-soft)] pt-5">
              <CheckCircle2 className="size-5 text-[var(--color-text-inverse)]" />
              <span className="text-sm font-semibold text-[var(--color-text-inverse)]">
                {homeMock.trustPanel.confirmation}
              </span>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
