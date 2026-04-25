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
            <Button className="rounded-[var(--radius-control)] bg-[var(--color-brand)] px-4 py-[13px] text-white hover:bg-[var(--color-brand-strong)]">
              ดูงวดล่าสุด
            </Button>
            <Button
              className="rounded-[var(--radius-control)] border-[var(--color-brand-outline)] bg-white px-4 py-[13px] text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
              variant="outline"
            >
              ตรวจ data contract
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
                className="rounded-[var(--radius-card)] border border-[var(--color-border-inverse-soft)] bg-[var(--color-bg-dark-soft)] p-4"
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
                  className="h-11 rounded-[var(--radius-control)] border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]"
                  placeholder="ค้นหาจากวันที่ออกรางวัลหรือเลขที่ถูกรางวัล"
                />
              </div>
            }
            className="border-b border-[var(--color-border-soft)] pb-5"
            eyebrow="ค้นหาและกรอง"
            title="สรุปงวดย้อนหลังล่าสุด"
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Select defaultValue={resultsMock.filters.defaultLotteryType}>
              <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 shadow-[var(--shadow-micro)]">
                <SelectValue placeholder="เลือกประเภทสลาก" />
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
              <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 shadow-[var(--shadow-micro)]">
                <SelectValue placeholder="เลือกรางวัล" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="รางวัลทั้งหมด">รางวัลทั้งหมด</SelectItem>
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
                className="rounded-[var(--radius-control)] bg-[var(--color-bg-brand-soft)] px-3 py-2 text-xs text-[var(--color-brand)] hover:bg-[var(--color-bg-brand-soft-strong)]"
                key={type}
                variant="ghost"
              >
                {type}
              </Button>
            ))}

            {resultsMock.filters.prizeTypes.map((type) => (
              <Button
                className="rounded-[var(--radius-control)] border-[var(--color-brand-outline)] bg-white px-3 py-2 text-xs text-[var(--color-brand-outline)] hover:bg-[var(--color-bg-brand-soft)]"
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
                className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-5"
                key={draw.id}
              >
                <div className="flex flex-col gap-3 border-b border-[var(--color-border-soft)] pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-brand-outline)]">
                      {draw.drawDate}
                    </p>
                    <h3 className="mt-1 text-xl font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">
                      งวดที่ {draw.drawNo}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={draw.status === "ครบถ้วน" ? "success" : "brand"}>
                      {draw.status}
                    </Badge>
                    <Badge variant="neutral">{draw.coverage}</Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {draw.prizes.map((prize) => (
                    <div
                      className="rounded-[var(--radius-control)] bg-[var(--color-bg-canvas)] px-4 py-3"
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
            eyebrow="ทำไมต้องเริ่มที่หน้านี้"
            title="หน้า Results เป็นตัวกำหนด shape ของข้อมูล seed"
          />
          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--color-text-secondary)]">
            <p>
              UI ชุดนี้บังคับให้เราตกลง read model ของงวดก่อนเริ่ม ingestion จริง ทั้งวันที่ออกรางวัล เลขงวด
              กลุ่มรางวัล และสถานะความครบถ้วนของข้อมูล
            </p>
            <p>
              เมื่อ shape นี้นิ่งแล้ว เราจะต่อ `/api/draws` และ map ข้อมูลจาก Prisma เข้าสู่ contract
              เดิมได้โดยมีความเสี่ยงในการรื้อน้อยลง
            </p>
          </div>

          <div className="mt-6 rounded-[var(--radius-card)] bg-[var(--color-bg-panel-brand)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-brand-outline)]">
              contract ฝั่ง backend ที่วางไว้
            </p>
            <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)]">
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
            <SectionHeading eyebrow="หมายเหตุสำหรับทีม" title="บันทึก mock note" />
            <div className="mt-3">
              <Textarea
                className="min-h-32 rounded-[var(--radius-control)] border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-4 py-3 shadow-[var(--shadow-micro)]"
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
