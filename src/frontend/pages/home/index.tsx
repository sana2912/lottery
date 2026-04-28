import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { ProductPreview } from "@/frontend/pages/home/home.components";
import {
  homeContent,
  homeFallbackFeatureIcon,
  homeFeatureIconMap
} from "@/frontend/pages/home/home.content";
import { Badge, Button } from "@/frontend/primitives";

export function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border-soft)] bg-[var(--color-bg-frosted)] px-4 py-4 backdrop-blur md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-none bg-[var(--color-brand)] text-[var(--primary-foreground)] shadow-[var(--shadow-micro)]">
              <Sparkles className="size-5" />
            </span>
            <span className="text-base font-bold tracking-normal text-[var(--color-text-primary)]">
              {homeContent.navigation.brand}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {homeContent.navigation.links.map((link) => (
              <Link
                className="rounded-none px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Button
            asChild
            className="rounded-none bg-[var(--color-brand)] px-4 py-[13px] text-[var(--primary-foreground)] hover:bg-[var(--color-brand-strong)]"
          >
            <Link href={homeContent.navigation.cta.href}>{homeContent.navigation.cta.label}</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)]">
        <ProductPreview />
        <div className="absolute inset-0 bg-[var(--color-bg-hero-scrim)] lg:bg-[var(--color-bg-hero-scrim-soft)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-[72px] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <Badge variant="brand">{homeContent.hero.eyebrow}</Badge>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-normal text-[var(--color-text-primary)] md:text-5xl">
              {homeContent.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] md:text-lg">
              {homeContent.hero.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="rounded-none bg-[var(--color-brand)] px-4 py-[13px] text-[var(--primary-foreground)] hover:bg-[var(--color-brand-strong)]"
              >
                <Link href={homeContent.hero.primaryAction.href}>
                  {homeContent.hero.primaryAction.label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="rounded-none border-[var(--color-brand-outline)] bg-[var(--color-bg-canvas)] px-4 py-[13px] text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
                variant="outline"
              >
                <Link href={homeContent.hero.secondaryAction.href}>
                  {homeContent.hero.secondaryAction.label}
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {homeContent.metrics.map((metric) => (
              <div
                className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-card)]"
                key={metric.label}
              >
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-bold tracking-normal text-[var(--color-text-primary)]">
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
              <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                {homeContent.featureSection.eyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-normal text-[var(--color-text-primary)]">
                {homeContent.featureSection.title}
              </h2>
            </div>
            <Button
              asChild
              className="rounded-none bg-[var(--color-bg-brand-soft)] px-4 py-[13px] text-[var(--color-brand)] hover:bg-[var(--color-bg-brand-soft-strong)]"
              variant="ghost"
            >
              <Link href={homeContent.featureSection.actionHref}>
                {homeContent.featureSection.actionLabel}
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {homeContent.features.map((feature) => {
              const Icon =
                homeFeatureIconMap[feature.icon as keyof typeof homeFeatureIconMap] ??
                homeFallbackFeatureIcon;

              return (
                <Link
                  className="group flex min-h-[230px] flex-col rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--color-brand-outline)]"
                  href={feature.href}
                  key={feature.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-none bg-[var(--color-bg-brand-soft)] text-[var(--color-brand)]">
                      <Icon className="size-5" />
                    </span>
                    <Badge variant="neutral">{feature.status}</Badge>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-normal text-[var(--color-text-primary)]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {feature.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand)]">
                    {homeContent.featureSection.itemActionLabel}
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
            {homeContent.workflow.map((item) => (
              <div
                className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5"
                key={item.step}
              >
                <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
                  {item.step}
                </p>
                <h3 className="mt-4 text-lg font-semibold tracking-normal text-[var(--color-text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <aside className="rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-dark)] p-6 text-[var(--color-text-inverse)] shadow-[var(--shadow-card)]">
            <div className="flex size-11 items-center justify-center rounded-none bg-[var(--color-bg-dark-softer)]">
              <ShieldCheck className="size-5" />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-normal text-[var(--color-text-inverse-muted)]">
              {homeContent.trustPanel.label}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-normal">
              {homeContent.trustPanel.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-text-inverse-soft)]">
              {homeContent.trustPanel.description}
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-[var(--color-border-inverse-soft)] pt-5">
              <CheckCircle2 className="size-5 text-[var(--color-text-inverse)]" />
              <span className="text-sm font-semibold text-[var(--color-text-inverse)]">
                {homeContent.trustPanel.confirmation}
              </span>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
