import type { LotterySurvivalPrize } from "@/schema/app/lottery-survival.schema";

export const LOTTERY_SURVIVAL_INITIAL_BALANCE = 800_000;
export const LOTTERY_SURVIVAL_TICKET_PRICE = 80;
export const LOTTERY_SURVIVAL_PREVIEW_PAGE_SIZE = 48;

export const LOTTERY_SURVIVAL_PAYOUTS = {
  FIRST: 6_000_000,
  NEAR_FIRST: 100_000,
  PRIZE2: 200_000,
  PRIZE3: 80_000,
  PRIZE4: 40_000,
  PRIZE5: 20_000,
  THREE_BACK: 4_000,
  THREE_DIGIT: 4_000,
  THREE_FRONT: 4_000,
  TWO_DIGIT: 2_000
} as const satisfies Partial<Record<LotterySurvivalPrize["type"], number>>;

export function getLotterySurvivalPrizePayout(type: string): number {
  return LOTTERY_SURVIVAL_PAYOUTS[type as keyof typeof LOTTERY_SURVIVAL_PAYOUTS] ?? 0;
}

export function getLotterySurvivalPrizeLabel(type: string, position?: number): string {
  const labels: Record<string, string> = {
    FIRST: "รางวัลที่ 1",
    NEAR_FIRST: "รางวัลข้างเคียงรางวัลที่ 1",
    OTHER: "อื่นๆ",
    PRIZE2: "รางวัลที่ 2",
    PRIZE3: "รางวัลที่ 3",
    PRIZE4: "รางวัลที่ 4",
    PRIZE5: "รางวัลที่ 5",
    THREE_BACK: "เลขท้าย 3 ตัว",
    THREE_DIGIT: "เลข 3 ตัว",
    THREE_FRONT: "เลขหน้า 3 ตัว",
    TWO_DIGIT: "เลขท้าย 2 ตัว"
  };
  const label = labels[type] ?? type;

  return position ? `${label} #${position}` : label;
}
