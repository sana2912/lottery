import { SlidingNumber } from "@/frontend/components/animate-ui/primitives/texts/sliding-number";
import resultsMock from "@/frontend/pages/results/results.mock.json";
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

type ResultsMock = typeof resultsMock;

function StatCard({ stat }: { stat: ResultsMock["stats"][number] }) {
  const isNumericValue = /^\d+$/.test(stat.value);

  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">{stat.label}</p>
      <p className="mt-3 text-2xl font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">
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

export function ResultsPage() {
  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden bg-[image:var(--color-bg-hero-accent),var(--color-bg-hero)] p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-outline)]">
            {resultsMock.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)] md:text-5xl">
            {resultsMock.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {resultsMock.hero.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-none bg-[var(--color-brand)] px-4 py-[13px] text-white hover:bg-[var(--color-brand-strong)]">
              เธ”เธนเธเธงเธ”เธฅเนเธฒเธชเธธเธ”
            </Button>
            <Button
              className="rounded-none border-[var(--color-brand-outline)] bg-white px-4 py-[13px] text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
              variant="outline"
            >
              เธ•เธฃเธงเธ data contract
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between bg-[var(--color-bg-dark)] p-6 text-[var(--color-text-inverse)]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
              {resultsMock.hero.coverageLabel}
            </p>
            <p className="mt-4 text-3xl font-bold tracking-[-0.03em]">
              {resultsMock.hero.coverageValue}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {resultsMock.highlights.map((highlight) => (
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
        {resultsMock.stats.map((stat) => (
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
                  placeholder="เธเนเธเธซเธฒเธเธฒเธเธงเธฑเธเธ—เธตเนเธญเธญเธเธฃเธฒเธเธงเธฑเธฅเธซเธฃเธทเธญเน€เธฅเธเธ—เธตเนเธ–เธนเธเธฃเธฒเธเธงเธฑเธฅ"
                />
              </div>
            }
            className="border-b border-[var(--color-border-soft)] pb-5"
            eyebrow="เธเนเธเธซเธฒเนเธฅเธฐเธเธฃเธญเธ"
            title="เธชเธฃเธธเธเธเธงเธ”เธขเนเธญเธเธซเธฅเธฑเธเธฅเนเธฒเธชเธธเธ”"
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Select defaultValue={resultsMock.filters.defaultLotteryType}>
              <SelectTrigger className="h-11 w-full rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 shadow-[var(--shadow-micro)]">
                <SelectValue placeholder="เน€เธฅเธทเธญเธเธเธฃเธฐเน€เธ เธ—เธชเธฅเธฒเธ" />
              </SelectTrigger>
              <SelectContent>
                {resultsMock.filters.lotteryTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue={resultsMock.filters.defaultPrizeType}>
              <SelectTrigger className="h-11 w-full rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 shadow-[var(--shadow-micro)]">
                <SelectValue placeholder="เน€เธฅเธทเธญเธเธฃเธฒเธเธงเธฑเธฅ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="เธฃเธฒเธเธงเธฑเธฅเธ—เธฑเนเธเธซเธกเธ”">
                  เธฃเธฒเธเธงเธฑเธฅเธ—เธฑเนเธเธซเธกเธ”
                </SelectItem>
                {resultsMock.filters.prizeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {resultsMock.filters.lotteryTypes.map((type) => (
              <Button
                className="rounded-none bg-[var(--color-bg-brand-soft)] px-3 py-2 text-xs text-[var(--color-brand)] hover:bg-[var(--color-bg-brand-soft-strong)]"
                key={type}
                variant="ghost"
              >
                {type}
              </Button>
            ))}

            {resultsMock.filters.prizeTypes.map((type) => (
              <Button
                className="rounded-none border-[var(--color-brand-outline)] bg-white px-3 py-2 text-xs text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
                key={type}
                variant="outline"
              >
                {type}
              </Button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {resultsMock.draws.map((draw) => (
              <article
                className="rounded-none border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5"
                key={draw.id}
              >
                <div className="flex flex-col gap-3 border-b border-[var(--color-border-soft)] pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-brand-outline)]">
                      {draw.drawDate}
                    </p>
                    <h3 className="mt-1 text-xl font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">
                      เธเธงเธ”เธ—เธตเน {draw.drawNo}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={draw.status === "เธเธฃเธเธ–เนเธงเธ" ? "success" : "brand"}>
                      {draw.status}
                    </Badge>
                    <Badge variant="neutral">{draw.coverage}</Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {draw.prizes.map((prize) => (
                    <div
                      className="rounded-none bg-[var(--color-bg-canvas)] px-4 py-3"
                      key={`${draw.id}-${prize.label}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
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
            eyebrow="เธ—เธณเนเธกเธ•เนเธญเธเน€เธฃเธดเนเธกเธ—เธตเนเธซเธเนเธฒเธเธตเน"
            title="เธซเธเนเธฒ Results เน€เธเนเธเธ•เธฑเธงเธเธณเธซเธเธ” shape เธเธญเธเธเนเธญเธกเธนเธฅ seed"
          />
          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--color-text-secondary)]">
            <p>
              UI เธเธธเธ”เธเธตเนเธเธฑเธเธเธฑเธเนเธซเนเน€เธฃเธฒเธ•เธเธฅเธ read model
              เธเธญเธเธเธงเธ”เธเนเธญเธเน€เธฃเธดเนเธก ingestion เธเธฃเธดเธ
              เธ—เธฑเนเธเธงเธฑเธเธ—เธตเนเธญเธญเธเธฃเธฒเธเธงเธฑเธฅ เน€เธฅเธเธเธงเธ”
              เธเธฅเธธเนเธกเธฃเธฒเธเธงเธฑเธฅ
              เนเธฅเธฐเธชเธ–เธฒเธเธฐเธเธงเธฒเธกเธเธฃเธเธ–เนเธงเธเธเธญเธเธเนเธญเธกเธนเธฅ
            </p>
            <p>
              เน€เธกเธทเนเธญ shape เธเธตเนเธเธดเนเธเนเธฅเนเธง เน€เธฃเธฒเธเธฐเธ•เนเธญ `/api/draws`
              เนเธฅเธฐ map เธเนเธญเธกเธนเธฅเธเธฒเธ Prisma เน€เธเนเธฒเธชเธนเน contract
              เน€เธ”เธดเธกเนเธ”เนเนเธ”เธขเธกเธตเธเธงเธฒเธกเน€เธชเธตเนเธขเธเนเธเธเธฒเธฃเธฃเธทเนเธญเธเนเธญเธขเธฅเธ
            </p>
          </div>

          <div className="mt-6 rounded-none bg-[var(--color-bg-panel-brand)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-brand-outline)]">
              contract เธเธฑเนเธ backend เธ—เธตเนเธงเธฒเธเนเธงเน
            </p>
            <div className="mt-3 overflow-hidden rounded-none border border-[var(--color-border-soft)]">
              <Table>
                <TableHeader className="bg-[var(--color-bg-subtle)]">
                  <TableRow className="border-b border-[var(--color-border-soft)] hover:bg-transparent">
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      field
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      source
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      purpose
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultsMock.contractRows.map((row) => (
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
            <SectionHeading
              eyebrow="เธซเธกเธฒเธขเน€เธซเธ•เธธเธชเธณเธซเธฃเธฑเธเธ—เธตเธก"
              title="เธเธฑเธเธ—เธถเธ mock note"
            />
            <div className="mt-3">
              <Textarea
                className="min-h-32 rounded-none border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]"
                readOnly
                value={resultsMock.mockNote}
              />
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
