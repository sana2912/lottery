import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/frontend/components";
import { searchContent } from "@/frontend/pages/search/search.content";
import { getSearchPageData } from "@/frontend/pages/search/search.data";
import { Badge, Button, Card, Input, SectionHeading } from "@/frontend/primitives";

export async function SearchPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { model, query, state } = await getSearchPageData(searchParams);

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
            {searchContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {searchContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {searchContent.hero.description}
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="search query" title="Run a grouped search" />
          <form action="/search" className="mt-5 flex gap-2">
            <Input
              className="h-11 rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]"
              defaultValue={query.q ?? ""}
              name="q"
              placeholder={searchContent.searchForm.placeholder}
            />
            <Button className="rounded-none px-4 py-[13px]" type="submit">
              {searchContent.searchForm.buttonLabel}
            </Button>
          </form>
          {query.q ? (
            <div className="mt-4">
              <Badge variant="brand">Query: {query.q}</Badge>
            </div>
          ) : null}
        </Card>
      </section>

      {state === "error" ? (
        <EmptyState
          description={searchContent.errorState.description}
          title={searchContent.errorState.title}
        />
      ) : null}

      {state === "empty" ? (
        <EmptyState
          description={searchContent.emptyState.description}
          title={searchContent.emptyState.title}
        />
      ) : null}

      {state === "ready" ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <SearchGroupCard
            eyebrow={searchContent.groups.draws.eyebrow}
            title={searchContent.groups.draws.title}
          >
            <div className="space-y-3">
              {model.groups.draws.map((draw) => (
                <article
                  className="border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
                  key={draw.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        Draw {draw.drawNo}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {new Date(draw.drawDate).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                    <Badge variant={draw.sourceStatus === "VERIFIED" ? "success" : "warning"}>
                      {draw.sourceStatus}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/results/${draw.id}`}>Open draw</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </SearchGroupCard>

          <SearchGroupCard
            eyebrow={searchContent.groups.prizes.eyebrow}
            title={searchContent.groups.prizes.title}
          >
            <div className="space-y-3">
              {model.groups.prizes.map((prize) => (
                <article
                  className="border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
                  key={prize.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xl font-bold text-[var(--color-text-primary)]">
                        {prize.number}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {prize.prizeType} | Draw {prize.drawNo}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/results/${prize.drawId}`}>Open draw</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </SearchGroupCard>

          <SearchGroupCard
            eyebrow={searchContent.groups.stats.eyebrow}
            title={searchContent.groups.stats.title}
          >
            <div className="space-y-3">
              {model.groups.stats.map((stat) => (
                <article
                  className="border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4"
                  key={`${stat.prizeType}-${stat.number}-${stat.drawCount}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xl font-bold text-[var(--color-text-primary)]">
                        {stat.number}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {stat.prizeType} | {stat.drawCount} draws in sample
                      </p>
                    </div>
                    <Badge variant="brand">{stat.frequencyPercent}%</Badge>
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    Hits: {stat.hitCount} | Missing: {stat.missingDrawCount} | Trend:{" "}
                    {stat.trendScore}
                  </p>
                </article>
              ))}
            </div>
          </SearchGroupCard>
        </section>
      ) : null}
    </main>
  );
}

function SearchGroupCard({
  children,
  eyebrow,
  title
}: Readonly<{
  children: ReactNode;
  eyebrow: string;
  title: string;
}>) {
  return (
    <Card className="p-6">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="mt-5">{children}</div>
    </Card>
  );
}
