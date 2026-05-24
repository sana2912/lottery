import type { SimulationDraw } from "@/api/service/time-machine/near-miss";
import { isEligiblePrizeType } from "@/api/service/time-machine/prize-comparison";
import type { TimeMachineDrawPrize } from "@/schema/app/time-machine.schema";

export function buildDrawPrizes(draw: SimulationDraw): TimeMachineDrawPrize[] {
  return [...draw.prizes]
    .filter((prize) => isEligiblePrizeType(prize.type))
    .sort(sortDrawPrize)
    .map((prize) => ({
      label: getPrizeLabel(prize.type, prize.position),
      number: prize.number,
      position: prize.position,
      type: prize.type
    }));
}

function sortDrawPrize(
  left: SimulationDraw["prizes"][number],
  right: SimulationDraw["prizes"][number]
): number {
  const typeOrder = getPrizeTypeOrder(left.type) - getPrizeTypeOrder(right.type);

  if (typeOrder !== 0) {
    return typeOrder;
  }

  return (left.position ?? 0) - (right.position ?? 0);
}

function getPrizeTypeOrder(type: string): number {
  const order: Record<string, number> = {
    FIRST: 1,
    NEAR_FIRST: 2,
    PRIZE2: 3,
    PRIZE3: 4,
    PRIZE4: 5,
    PRIZE5: 6,
    THREE_DIGIT: 7,
    THREE_FRONT: 8,
    THREE_BACK: 9,
    TWO_DIGIT: 10
  };

  return order[type] ?? 99;
}

function getPrizeLabel(type: string, position?: number): string {
  const labels: Record<string, string> = {
    FIRST: "รางวัลที่ 1",
    NEAR_FIRST: "รางวัลข้างเคียงรางวัลที่ 1",
    OTHER: "อื่นๆ",
    PRIZE2: "รางวัลที่ 2",
    PRIZE3: "รางวัลที่ 3",
    PRIZE4: "รางวัลที่ 4",
    PRIZE5: "รางวัลที่ 5",
    THREE_DIGIT: "เลข 3 ตัว",
    THREE_BACK: "เลขท้าย 3 ตัว",
    THREE_FRONT: "เลขหน้า 3 ตัว",
    TWO_DIGIT: "เลขท้าย 2 ตัว"
  };

  const label = labels[type] ?? type;

  return position ? `${label} #${position}` : label;
}
