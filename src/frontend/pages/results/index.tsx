import Link from "next/link";
import { EmptyState } from "@/frontend/components";
import { SlidingNumber } from "@/frontend/components/animate-ui/primitives/texts/sliding-number";
import resultsMockJson from "@/frontend/pages/results/results.mock.json";
import {
  Badge,
  Button,
  Card,
  Input,
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
import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type DrawListResponse, drawListResponseSchema } from "@/schema/app/draw.schema";
import { type ResultsReadModel, resultsReadModelSchema } from "@/schema/app/results.schema";

const resultsMock = resultsReadModelSchema.parse(resultsMockJson);

async function getResultsModel(): Promise<ResultsReadModel> {
  try {
    const response = await apiGet<DrawListResponse>(apiRoutes.draws, {
      cache: "no-store",
      schema: drawListResponseSchema
    });

    return resultsReadModelSchema.parse(toResultsModel(response));
  } catch {
    return resultsMock;
  }
}

function toResultsModel(response: DrawListResponse): ResultsReadModel {
  const latestDraw = response.draws[0];
  const prizeCount = response.draws.reduce((total, draw) => total + draw.prizes.length, 0);

  return {
    ...resultsMock,
    draws: response.draws.map((draw) => ({
      coverage: draw.coverage,
      drawDate: draw.drawDate,
      drawDateIso: draw.drawDateIso,
      drawNo: draw.drawNo,
      id: draw.id,
      lotteryType: draw.lotteryType,
      prizes: draw.prizes.map((prize) => ({
        label: prize.label,
        prizeType: prize.type,
        value: prize.number
      })),
      status: draw.status,
      statusLabel: draw.statusLabel
    })),
    generatedAt: response.generatedAt,
    mockNote:
      response.draws.length > 0
        ? "This page is using the /api/draws contract. If the database is empty or unavailable, the UI falls back to the checked mock read model."
        : "The /api/draws contract returned no draws. Seed historical draws before enabling analytics.",
    source: response.source,
    stats: [
      {
        hint: "Latest draw returned by the draw service contract.",
        label: "Latest draw",
        value: latestDraw?.drawDate ?? "-"
      },
      {
        hint: "Draw count from the current API query.",
        label: "Draw records",
        value: String(response.pagination.total)
      },
      {
        hint: "Prize rows returned in the current page.",
        label: "Prize records",
        value: String(prizeCount)
      }
    ]
  };
}

function StatCard({ stat }: { stat: ResultsReadModel["stats"][number] }) {
  const isNumericValue = /^\d+$/.test(stat.value);

  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">{stat.label}</p>
      <p className="mt-3 text-2xl font-bold tracking-normal text-[var(--color-text-primary)]">
        {isNumericValue ? (
          <SlidingNumber
            className="inline-flex"
            fromNumber={0}
            inView
            initiallyStable={false}
            number={Number(stat.value)}
          />
        ) : (
          stat.value
        )}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{stat.hint}</p>
    </Card>
  );
}

export async function ResultsPage() {
  const resultsModel = await getResultsModel();

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden bg-[image:var(--color-bg-hero-accent),var(--color-bg-hero)] p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
            {resultsModel.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)] md:text-5xl">
            {resultsModel.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {resultsModel.hero.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-none bg-[var(--color-brand)] px-4 py-[13px] text-[var(--primary-foreground)] hover:bg-[var(--color-brand-strong)]">
              View latest draw
            </Button>
            <Button
              className="rounded-none border-[var(--color-brand-outline)] bg-[var(--color-bg-canvas)] px-4 py-[13px] text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
              variant="outline"
            >
              Review data contract
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between bg-[var(--color-bg-dark)] p-6 text-[var(--color-text-inverse)]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-text-inverse-soft)]">
              {resultsModel.hero.coverageLabel}
            </p>
            <p className="mt-4 text-3xl font-bold tracking-normal">
              {resultsModel.hero.coverageValue}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {resultsModel.highlights.map((highlight) => (
              <div
                className="rounded-none border border-[var(--color-border-inverse-soft)] bg-[var(--color-bg-dark-soft)] p-4"
                key={highlight.title}
              >
                <p className="font-semibold">{highlight.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-inverse-soft)]">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {resultsModel.stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <Card className="p-6">
          <SectionHeading
            actions={
              <div className="w-full max-w-sm">
                <Input
                  className="h-11 rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]"
                  placeholder="Search by draw date or winning number"
                />
              </div>
            }
            className="border-b border-[var(--color-border-soft)] pb-5"
            eyebrow="search and filter"
            title="Recent historical draws"
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Select defaultValue={resultsModel.filters.defaultLotteryType}>
              <SelectTrigger className="h-11 w-full rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 shadow-[var(--shadow-micro)]">
                <SelectValue placeholder="Select lottery type" />
              </SelectTrigger>
              <SelectContent>
                {resultsModel.filters.lotteryTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue={resultsModel.filters.defaultPrizeType}>
              <SelectTrigger className="h-11 w-full rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 shadow-[var(--shadow-micro)]">
                <SelectValue placeholder="Select prize type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All prize types">All prize types</SelectItem>
                {resultsModel.filters.prizeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {resultsModel.filters.lotteryTypes.map((type) => (
              <Button
                className="rounded-none bg-[var(--color-bg-brand-soft)] px-3 py-2 text-xs text-[var(--color-brand)] hover:bg-[var(--color-bg-brand-soft-strong)]"
                key={type}
                variant="ghost"
              >
                {type}
              </Button>
            ))}

            {resultsModel.filters.prizeTypes.map((type) => (
              <Button
                className="rounded-none border-[var(--color-brand-outline)] bg-[var(--color-bg-canvas)] px-3 py-2 text-xs text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
                key={type}
                variant="outline"
              >
                {type}
              </Button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {resultsModel.draws.length === 0 ? (
              <EmptyState
                description="The draw API returned an empty result set for the current filters."
                title="No draw records"
              />
            ) : null}

            {resultsModel.draws.map((draw) => (
              <article
                className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5"
                key={draw.id}
              >
                <div className="flex flex-col gap-3 border-b border-[var(--color-border-soft)] pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-brand-outline)]">
                      {draw.drawDate}
                    </p>
                    <h3 className="mt-1 text-xl font-bold tracking-normal text-[var(--color-text-primary)]">
                      Draw {draw.drawNo}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={draw.status === "complete" ? "success" : "warning"}>
                      {draw.statusLabel}
                    </Badge>
                    <Badge variant="neutral">{draw.coverage}</Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/results/${draw.id}`}>Detail</Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {draw.prizes.map((prize) => (
                    <div
                      className="rounded-none bg-[var(--color-bg-canvas)] px-4 py-3"
                      key={`${draw.id}-${prize.label}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {prize.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                        {prize.value}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow="why this page matters"
            title="Results defines the base shape for historical draw data"
          />
          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--color-text-secondary)]">
            <p>
              This screen forces the first stable read model for historical draws before deeper
              ingestion work begins. It locks the displayed date, draw number, grouped prize values,
              and data coverage status in one place.
            </p>
            <p>
              Once that shape is stable, the `/api/draws` service can map Prisma data into the same
              contract with less risk of frontend churn.
            </p>
          </div>

          <div className="mt-6 rounded-none bg-[var(--color-bg-panel-brand)] p-4">
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-brand-outline)]">
              backend contract fields
            </p>
            <div className="mt-3 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
              <Table>
                <TableHeader className="bg-[var(--color-bg-subtle)]">
                  <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      field
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      source
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                      purpose
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultsModel.contractRows.map((row) => (
                    <TableRow
                      className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-subtle)]/50"
                      key={row.field}
                    >
                      <TableCell className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                        {row.field}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {row.source}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {row.purpose}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-6">
            <SectionHeading eyebrow="team note" title="Mock contract note" />
            <div className="mt-3">
              <Textarea
                className="min-h-32 rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]"
                readOnly
                value={resultsModel.mockNote}
              />
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
