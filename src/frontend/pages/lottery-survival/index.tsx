"use client";

import {
  CircleDollarSign,
  Dices,
  History,
  Loader2,
  PauseCircle,
  RotateCcw,
  Sparkles,
  Ticket,
  Wand2
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useMemo, useReducer, useState } from "react";
import { MetricCard } from "@/frontend/components";
import { SlidingNumber } from "@/frontend/components/animate-ui/primitives/texts/sliding-number";
import { runLotterySurvivalRound } from "@/frontend/pages/lottery-survival/lottery-survival.data";
import {
  buildLotterySurvivalPayload,
  canUseManualTickets,
  DEFAULT_FAVORITE_DIGITS,
  formatLotterySurvivalCurrency,
  formatLotterySurvivalSignedCurrency,
  getAffordableTicketCount,
  getLotterySurvivalPatternOptions,
  getRoundNet,
  type LotterySurvivalSummary,
  lotterySurvivalStrategyOptions,
  normalizeManualTicketDraft,
  parseManualTickets
} from "@/frontend/pages/lottery-survival/lottery-survival.mappers";
import {
  initialLotterySurvivalState,
  lotterySurvivalReducer
} from "@/frontend/pages/lottery-survival/lottery-survival.reducer";
import { Badge, Button, Card, Label, SectionHeading, Textarea } from "@/frontend/primitives";
import { cn } from "@/lib/app/cn";
import {
  type LotterySurvivalNearMiss,
  type LotterySurvivalRoundResponse,
  type LotterySurvivalStrategy,
  lotterySurvivalRoundRequestSchema
} from "@/schema/app/lottery-survival.schema";

const DIGIT_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const WINNING_TICKET_VISIBLE_LIMIT = 8;

export function LotterySurvivalPage() {
  const [state, dispatch] = useReducer(lotterySurvivalReducer, initialLotterySurvivalState);
  const patternOptions = useMemo(() => getLotterySurvivalPatternOptions(), []);
  const [strategy, setStrategy] = useState<LotterySurvivalStrategy>("random");
  const [patternId, setPatternId] = useState(patternOptions[0]?.id ?? "has_repeat");
  const [favoriteDigits, setFavoriteDigits] = useState<string[]>([...DEFAULT_FAVORITE_DIGITS]);
  const [manualTicketDraft, setManualTicketDraft] = useState("");
  const affordableTicketCount = getAffordableTicketCount(state.balance);
  const manualAllowed = canUseManualTickets(state.balance);
  const manualParse = parseManualTickets(manualTicketDraft);
  const manualOverflow = manualAllowed && manualParse.tickets.length > affordableTicketCount;
  const favoriteRequired = strategy === "favorite" || strategy === "patternFavorite";
  const patternRequired = strategy === "pattern" || strategy === "patternFavorite";
  const lastRound = state.history.at(-1);

  async function handleNextRound() {
    if (state.phase === "ended") {
      return;
    }

    if (favoriteRequired && favoriteDigits.length !== 2) {
      dispatch({ message: "เลือกเลขที่ชอบให้ครบ 2 เลขก่อนเริ่มงวด", type: "ROUND_FAILED" });
      return;
    }

    if (manualParse.invalidTickets.length > 0) {
      dispatch({
        message: `เลขที่กรอกไม่ถูกต้อง: ${manualParse.invalidTickets.slice(0, 3).join(", ")}`,
        type: "ROUND_FAILED"
      });
      return;
    }

    if (manualOverflow) {
      dispatch({
        message: `กรอกเองได้ไม่เกิน ${affordableTicketCount} ใบในงวดนี้`,
        type: "ROUND_FAILED"
      });
      return;
    }

    dispatch({ type: "ROUND_REQUESTED" });

    try {
      const payload = lotterySurvivalRoundRequestSchema.parse(
        buildLotterySurvivalPayload({
          balance: state.balance,
          favoriteDigits,
          manualTicketDraft,
          patternId,
          roundIndex: state.roundIndex,
          strategy
        })
      );
      const round = await runLotterySurvivalRound(payload);

      dispatch({ round, type: "ROUND_SUCCEEDED" });
      setManualTicketDraft("");
    } catch (error) {
      dispatch({
        message: error instanceof Error ? error.message : "ไม่สามารถจำลองงวดนี้ได้",
        type: "ROUND_FAILED"
      });
    }
  }

  function toggleFavoriteDigit(digit: string) {
    setFavoriteDigits((current) => {
      if (current.includes(digit)) {
        return current.filter((item) => item !== digit);
      }

      return [...current, digit].slice(-2);
    });
  }

  if (state.phase === "ended" && state.summary) {
    return (
      <LotterySurvivalSummaryScreen
        onRestart={() => dispatch({ type: "RESET" })}
        summary={state.summary}
      />
    );
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden p-0">
          <div className="relative min-h-[420px] bg-[linear-gradient(180deg,var(--color-bg-glass-strong),var(--color-bg-canvas))] p-6 md:p-8">
            <TimelinePulse active={state.isPending} />
            <div className="relative z-10 max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--secondary)]">
                Lottery Survival Simulation
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
                เงิน 800,000 บาท จะพาคุณอยู่รอดในระบบหวยไทยได้นานแค่ไหน
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                ใช้เงินที่เหลือซื้อสลากให้เต็มจำนวนทุกงวด แล้วสุ่มงวดจริงย้อนหลังจากฐานข้อมูลเพื่อคิดรางวัลจริงกลับเข้า
                balance
              </p>
            </div>

            <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-3">
              <BalancePanel balance={state.balance} />
              <MetricTile
                icon={<Ticket className="size-5" />}
                label="ซื้อได้งวดนี้"
                value={`${formatLotterySurvivalCurrency(affordableTicketCount)} ใบ`}
              />
              <MetricTile
                icon={<History className="size-5" />}
                label="อยู่รอดแล้ว"
                value={`${state.history.length} งวด`}
              />
            </div>

            <RoundBoard lastRound={lastRound} pending={state.isPending} />
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Control" title="ตั้งค่างวดถัดไป" />
          <div className="mt-5 space-y-5">
            <StrategySelector onChange={setStrategy} strategy={strategy} />

            {patternRequired ? (
              <div>
                <Label htmlFor="survival-pattern">Pattern</Label>
                <select
                  className="mt-2 h-10 w-full rounded-none border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-micro)] focus:border-[var(--color-brand)] focus:outline-none"
                  id="survival-pattern"
                  onChange={(event) => setPatternId(event.target.value)}
                  value={patternId}
                >
                  {patternOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {favoriteRequired ? (
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  เลขที่ชอบ 2 เลข
                </p>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {DIGIT_OPTIONS.map((digit) => (
                    <Button
                      aria-pressed={favoriteDigits.includes(digit)}
                      className={cn(
                        "font-mono",
                        favoriteDigits.includes(digit) &&
                          "border-[var(--secondary)] bg-[var(--secondary-soft)] text-[var(--secondary)]"
                      )}
                      key={digit}
                      onClick={() => toggleFavoriteDigit(digit)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      {digit}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {manualAllowed ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="survival-manual">กรอกเลขเอง</Label>
                  <Badge variant={manualOverflow ? "danger" : "neutral"}>
                    {manualParse.tickets.length} / {affordableTicketCount}
                  </Badge>
                </div>
                <Textarea
                  className="mt-2 min-h-24 font-mono text-sm"
                  id="survival-manual"
                  onChange={(event) =>
                    setManualTicketDraft(normalizeManualTicketDraft(event.target.value))
                  }
                  placeholder="000123 445566 987654"
                  value={manualTicketDraft}
                />
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  ถ้ากรอกไม่ครบ ระบบจะ generate เพิ่มให้ครบจำนวนใบที่ซื้อได้
                </p>
              </div>
            ) : null}

            {state.error ? (
              <div className="border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
                {state.error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={state.isPending || affordableTicketCount < 1}
                onClick={handleNextRound}
                type="button"
              >
                {state.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Dices className="size-4" />
                )}
                เล่นงวดถัดไป
              </Button>
              <Button
                disabled={state.isPending}
                onClick={() => dispatch({ type: "STOP" })}
                type="button"
                variant="outline"
              >
                <PauseCircle className="size-4" />
                หยุดเกม
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <RoundDetail round={lastRound} />
        <HistoryPanel history={state.history} />
      </section>
    </main>
  );
}

function BalancePanel({ balance }: Readonly<{ balance: number }>) {
  return (
    <div className="border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
          <CircleDollarSign className="size-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
            เงินคงเหลือ
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums text-[var(--color-text-primary)]">
            <SlidingNumber
              initiallyStable
              number={balance}
              thousandSeparator=","
              transition={{ damping: 28, stiffness: 180 }}
            />{" "}
            บาท
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value
}: Readonly<{ icon: ReactNode; label: string; value: string }>) {
  return (
    <div className="border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center bg-[var(--secondary-soft)] text-[var(--secondary)]">
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="font-mono text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StrategySelector({
  onChange,
  strategy
}: Readonly<{
  onChange: (strategy: LotterySurvivalStrategy) => void;
  strategy: LotterySurvivalStrategy;
}>) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">วิธีสร้างเลข</p>
      <div className="mt-2 grid gap-2">
        {lotterySurvivalStrategyOptions.map((option) => (
          <Button
            className="justify-start"
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
            variant={strategy === option.value ? "secondary" : "outline"}
          >
            {option.value === "random" ? (
              <Dices className="size-4" />
            ) : (
              <Wand2 className="size-4" />
            )}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function TimelinePulse({ active }: Readonly<{ active: boolean }>) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <motion.div
        animate={active ? { x: ["-35%", "100%"] } : { x: "-35%" }}
        className="absolute top-0 h-full w-1/3 bg-[linear-gradient(90deg,transparent,var(--color-bg-brand-soft),transparent)] opacity-60"
        transition={{ duration: 1.4, ease: "easeInOut", repeat: active ? Infinity : 0 }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,var(--secondary),transparent)]" />
    </div>
  );
}

function RoundBoard({
  lastRound,
  pending
}: Readonly<{ lastRound?: LotterySurvivalRoundResponse; pending: boolean }>) {
  return (
    <div className="relative z-10 mt-6 border border-[var(--color-border-soft)] bg-[var(--color-bg-glass)] p-5 shadow-[var(--shadow-glass)] backdrop-blur-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
            งวดล่าสุด
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {lastRound ? `งวดที่ ${lastRound.roundIndex}` : "พร้อมเริ่มจำลอง"}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {lastRound?.narratorMessage ?? "เลือกวิธีสร้างเลข แล้วพาเงิน 800,000 บาทเข้าสู่สนามจริง"}
          </p>
        </div>
        {pending ? (
          <Badge variant="prediction">
            <Sparkles className="mr-1 size-3" />
            กำลังสุ่มงวดจริง
          </Badge>
        ) : null}
      </div>

      {lastRound ? (
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <MetricCard
            label="เงินก่อนซื้อ"
            value={`${formatLotterySurvivalCurrency(lastRound.balanceBefore)} บาท`}
          />
          <MetricCard
            label="ใช้ซื้อ"
            value={`${formatLotterySurvivalCurrency(lastRound.purchaseCost)} บาท`}
          />
          <MetricCard
            label="เงินรางวัล"
            value={`${formatLotterySurvivalCurrency(lastRound.prizeTotal)} บาท`}
          />
          <MetricCard
            label="หลังจบงวด"
            value={`${formatLotterySurvivalCurrency(lastRound.balanceAfter)} บาท`}
          />
        </div>
      ) : null}
    </div>
  );
}

function RoundDetail({ round }: Readonly<{ round?: LotterySurvivalRoundResponse }>) {
  if (!round) {
    return (
      <Card className="p-6">
        <SectionHeading eyebrow="Round" title="ยังไม่มีประวัติการเล่น" />
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          หลังจบงวดแรก ระบบจะแสดงสลากที่ซื้อ ผลรางวัลจริง สลากที่ถูกรางวัล และเหตุการณ์เกือบถูกตรงนี้
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Draw result" title={round.draw.drawDateLabel} />
        <Badge variant={round.prizeTotal > 0 ? "success" : "neutral"}>
          {round.draw.sourceStatus}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        ใช้งวดจริงจากฐานข้อมูล {round.draw.drawNo ? `หมายเลขงวด ${round.draw.drawNo}` : ""}
      </p>

      <PrizeStrip prizes={round.draw.prizes} />
      <TicketPreview round={round} />
      <WinningTickets round={round} />
      <NearMissPanel nearMisses={round.nearMisses} />
    </Card>
  );
}

function PrizeStrip({
  prizes
}: Readonly<{ prizes: LotterySurvivalRoundResponse["draw"]["prizes"] }>) {
  const importantPrizes = prizes.filter((prize) =>
    ["FIRST", "NEAR_FIRST", "THREE_DIGIT", "THREE_FRONT", "THREE_BACK", "TWO_DIGIT"].includes(
      prize.type
    )
  );

  return (
    <div className="mt-5 grid gap-2 md:grid-cols-2">
      {importantPrizes.slice(0, 10).map((prize) => (
        <div
          className={cn(
            "border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-3",
            prize.type === "FIRST" && "md:col-span-2"
          )}
          key={`${prize.type}-${prize.position ?? 0}-${prize.number}`}
        >
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">{prize.label}</p>
          <p className="mt-1 font-mono text-xl font-bold text-[var(--color-text-primary)]">
            {prize.number}
          </p>
        </div>
      ))}
    </div>
  );
}

function TicketPreview({ round }: Readonly<{ round: LotterySurvivalRoundResponse }>) {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">สลากในงวดนี้</p>
        <Badge variant="neutral">
          แสดง {round.ticketPreview.items.length} / {round.ticketPreview.total}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
        <AnimatePresence mode="popLayout">
          {round.ticketPreview.items.map((ticket, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "border px-3 py-2 text-center font-mono text-sm tabular-nums",
                ticket.source === "manual"
                  ? "border-[var(--secondary)] bg-[var(--secondary-soft)] text-[var(--secondary)]"
                  : "border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]"
              )}
              initial={{ opacity: 0, y: 8 }}
              key={ticket.id}
              transition={{ delay: Math.min(index, 18) * 0.018 }}
            >
              {ticket.number}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WinningTickets({ round }: Readonly<{ round: LotterySurvivalRoundResponse }>) {
  const visibleWinningTickets = round.winningTickets.slice(0, WINNING_TICKET_VISIBLE_LIMIT);
  const visiblePrizeTotal = visibleWinningTickets.reduce((sum, hit) => sum + hit.totalPrize, 0);
  const hiddenWinningEntryCount = Math.max(
    0,
    round.winBreakdown.totalGroupedWinningEntries - visibleWinningTickets.length
  );
  const hasHiddenPrizeMoney = visiblePrizeTotal !== round.winBreakdown.totalPrizeMoney;

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">สลากที่ถูกรางวัล</p>
      {round.winningTickets.length > 0 ? (
        <>
          <WinningBreakdown
            hasHiddenPrizeMoney={hasHiddenPrizeMoney}
            hiddenWinningEntryCount={hiddenWinningEntryCount}
            round={round}
            visiblePrizeTotal={visiblePrizeTotal}
            visibleWinningEntryCount={visibleWinningTickets.length}
          />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {visibleWinningTickets.map((hit) => (
              <motion.article
                animate={{ opacity: 1, scale: 1 }}
                className="border border-[var(--success)]/30 bg-[var(--success-soft)] p-4 shadow-[var(--shadow-card)]"
                initial={{ opacity: 0, scale: 0.98 }}
                key={`${hit.ticket}-${hit.prizeType}-${hit.prizeNumber}-${hit.segment}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-2xl font-bold text-[var(--success)]">
                      {hit.ticket}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                      {hit.prizeLabel}
                    </p>
                  </div>
                  <Badge variant="success">x{hit.quantity}</Badge>
                </div>
                <p className="mt-3 font-mono text-sm text-[var(--color-text-primary)]">
                  +{formatLotterySurvivalCurrency(hit.totalPrize)} บาท
                </p>
              </motion.article>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">งวดนี้ไม่มีสลากที่ถูกรางวัล</p>
      )}
    </div>
  );
}

function WinningBreakdown({
  hasHiddenPrizeMoney,
  hiddenWinningEntryCount,
  round,
  visiblePrizeTotal,
  visibleWinningEntryCount
}: Readonly<{
  hasHiddenPrizeMoney: boolean;
  hiddenWinningEntryCount: number;
  round: LotterySurvivalRoundResponse;
  visiblePrizeTotal: number;
  visibleWinningEntryCount: number;
}>) {
  return (
    <div className="mt-3 border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BreakdownMetric
          label="totalPrizeMoney"
          value={`${formatLotterySurvivalCurrency(round.winBreakdown.totalPrizeMoney)} บาท`}
        />
        <BreakdownMetric
          label="total visible winning entries"
          value={`${visibleWinningEntryCount} / ${round.winBreakdown.totalGroupedWinningEntries}`}
        />
        <BreakdownMetric
          label="total raw winning matches"
          value={`${formatLotterySurvivalCurrency(round.winBreakdown.totalRawWinningMatches)} matches`}
        />
        <BreakdownMetric
          label="visible subtotal"
          value={`${formatLotterySurvivalCurrency(visiblePrizeTotal)} บาท`}
        />
      </div>

      <div className="mt-4 space-y-2">
        {round.winBreakdown.byPrizeType.map((item) => (
          <div
            className="grid gap-2 border border-[var(--color-border-soft)] bg-[var(--color-bg-canvas)] p-3 text-xs sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
            key={item.prizeType}
          >
            <p className="font-semibold text-[var(--color-text-primary)]">{item.prizeLabel}</p>
            <p className="font-mono text-[var(--color-text-secondary)]">
              count by prize type {item.groupedEntryCount}
            </p>
            <p className="font-mono text-[var(--color-text-secondary)]">raw {item.rawMatchCount}</p>
            <p className="font-mono font-bold text-[var(--success)]">
              subtotal by prize type {formatLotterySurvivalCurrency(item.subtotal)} บาท
            </p>
          </div>
        ))}
      </div>

      {hiddenWinningEntryCount > 0 || hasHiddenPrizeMoney ? (
        <div className="mt-4 border border-[var(--warning)]/35 bg-[var(--warning-soft)] p-3 text-sm text-[var(--color-text-primary)]">
          รายการด้านล่างแสดง {visibleWinningEntryCount} จาก{" "}
          {round.winBreakdown.totalGroupedWinningEntries} grouped winning entries; ยอดที่เห็นรวม{" "}
          {formatLotterySurvivalCurrency(visiblePrizeTotal)} บาท จากยอดรวมทั้งหมด{" "}
          {formatLotterySurvivalCurrency(round.winBreakdown.totalPrizeMoney)} บาท
        </div>
      ) : null}
    </div>
  );
}

function BreakdownMetric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-bold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function NearMissPanel({
  nearMisses
}: Readonly<{ nearMisses: readonly LotterySurvivalNearMiss[] }>) {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">เหตุการณ์เกือบถูก</p>
      {nearMisses.length > 0 ? (
        <div className="mt-3 space-y-2">
          {nearMisses.slice(0, 5).map((nearMiss) => (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="border border-[var(--warning)]/35 bg-[var(--warning-soft)] p-3"
              initial={{ opacity: 0, x: -8 }}
              key={nearMiss.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[var(--warning)]">{nearMiss.label}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {nearMiss.description}
                  </p>
                </div>
                <Badge variant="warning">x{nearMiss.quantity}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">งวดนี้ไม่มีจังหวะเฉียดที่น่าจดจำ</p>
      )}
    </div>
  );
}

function HistoryPanel({ history }: Readonly<{ history: readonly LotterySurvivalRoundResponse[] }>) {
  return (
    <Card className="p-6">
      <SectionHeading eyebrow="Timeline" title="ประวัติรอบล่าสุด" />
      <div className="mt-5 space-y-3">
        {history.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">ยังไม่มีรอบที่จำลอง</p>
        ) : null}
        {history
          .slice(-8)
          .reverse()
          .map((round) => (
            <article
              className="border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-4"
              key={round.roundIndex}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    งวดที่ {round.roundIndex}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {round.draw.drawDateLabel}
                  </p>
                </div>
                <Badge variant={round.prizeTotal > 0 ? "success" : "neutral"}>
                  {formatLotterySurvivalSignedCurrency(getRoundNet(round))}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                ซื้อ {formatLotterySurvivalCurrency(round.ticketCount)} ใบ · ได้รางวัล{" "}
                {formatLotterySurvivalCurrency(round.prizeTotal)} บาท
              </p>
            </article>
          ))}
      </div>
    </Card>
  );
}

function LotterySurvivalSummaryScreen({
  onRestart,
  summary
}: Readonly<{
  onRestart: () => void;
  summary: LotterySurvivalSummary;
}>) {
  return (
    <main className="space-y-6">
      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeading eyebrow="Summary" title="สรุปเกม Lottery Survival" />
          <Button onClick={onRestart} type="button">
            <RotateCcw className="size-4" />
            เริ่มใหม่
          </Button>
        </div>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
          {summary.narratorMessage}
        </p>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="เงินเริ่มต้น"
          value={`${formatLotterySurvivalCurrency(summary.startingBalance)} บาท`}
        />
        <MetricCard label="จำนวนงวดที่อยู่รอด" value={`${summary.roundsSurvived} งวด`} />
        <MetricCard
          label="เงินสุดท้าย"
          value={`${formatLotterySurvivalCurrency(summary.finalBalance)} บาท`}
        />
        <MetricCard
          label="จำนวนสลากทั้งหมด"
          value={`${formatLotterySurvivalCurrency(summary.totalTickets)} ใบ`}
        />
        <MetricCard
          label="เงินรางวัลรวม"
          value={`${formatLotterySurvivalCurrency(summary.totalPrize)} บาท`}
        />
        <MetricCard
          label="รางวัลสูงสุดในงวดเดียว"
          value={`${formatLotterySurvivalCurrency(summary.maxPrizeSingleRound)} บาท`}
        />
        <MetricCard
          label="งวดที่ดีที่สุด"
          value={summary.bestRound ? `งวดที่ ${summary.bestRound.roundIndex}` : "-"}
        />
        <MetricCard
          label="งวดที่เลวร้ายที่สุด"
          value={summary.worstRound ? `งวดที่ ${summary.worstRound.roundIndex}` : "-"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <SectionHeading eyebrow="Best / Worst" title="ช่วงสำคัญของเกม" />
          <div className="mt-5 space-y-4">
            <SummaryRound label="งวดที่ดีที่สุด" round={summary.bestRound} />
            <SummaryRound label="งวดที่เลวร้ายที่สุด" round={summary.worstRound} />
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Near miss" title="จังหวะเกือบถูกที่ใกล้ที่สุด" />
          {summary.closestNearMiss ? (
            <div className="mt-5 border border-[var(--warning)]/35 bg-[var(--warning-soft)] p-4">
              <p className="text-sm font-bold text-[var(--warning)]">
                {summary.closestNearMiss.label}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {summary.closestNearMiss.description}
              </p>
              <p className="mt-3 font-mono text-xl font-bold text-[var(--color-text-primary)]">
                {summary.closestNearMiss.ticket}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
              ไม่มี near miss ที่โดดเด่นในเกมนี้
            </p>
          )}
        </Card>
      </section>
    </main>
  );
}

function SummaryRound({
  label,
  round
}: Readonly<{ label: string; round?: LotterySurvivalRoundResponse }>) {
  if (!round) {
    return (
      <div className="border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-4">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">-</p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-border-soft)] bg-[var(--color-bg-subtle)] p-4">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        งวดที่ {round.roundIndex} · {round.draw.drawDateLabel}
      </p>
      <p className="mt-2 font-mono text-lg font-bold text-[var(--color-text-primary)]">
        {formatLotterySurvivalSignedCurrency(getRoundNet(round))} บาท
      </p>
    </div>
  );
}
