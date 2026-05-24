export function getExactHitPoints(prizeType: string): number {
  switch (prizeType) {
    case "FIRST":
      return 10_000;
    case "NEAR_FIRST":
      return 2_500;
    case "PRIZE2":
    case "PRIZE3":
    case "PRIZE4":
    case "PRIZE5":
      return 900;
    case "THREE_FRONT":
    case "THREE_BACK":
    case "THREE_DIGIT":
      return 500;
    case "TWO_DIGIT":
      return 200;
    default:
      return 0;
  }
}

export const FIRST_NEAR_MISS_POINTS = 300;

export function getNearMissBasePoints(input: {
  digitDistance: number;
  prizeType: string;
  segment: "full6" | "front3" | "back3" | "last2";
}): number {
  if (input.prizeType === "FIRST" && input.segment === "full6" && input.digitDistance === 1) {
    return FIRST_NEAR_MISS_POINTS;
  }

  return 0;
}

export function isScorableNearMiss(input: {
  digitDistance: number;
  prizeType: string;
  segment: "full6" | "front3" | "back3" | "last2";
}): boolean {
  return input.prizeType === "FIRST" && input.segment === "full6" && input.digitDistance === 1;
}
