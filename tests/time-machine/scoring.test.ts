import { describe, expect, test } from "bun:test";
import {
  FIRST_NEAR_MISS_POINTS,
  getExactHitPoints,
  getNearMissBasePoints,
  isScorableNearMiss
} from "@/api/service/time-machine/scoring";

describe("time-machine scoring", () => {
  test("exact hit points follow prize tiers", () => {
    expect(getExactHitPoints("FIRST")).toBe(10_000);
    expect(getExactHitPoints("NEAR_FIRST")).toBe(2_500);
    expect(getExactHitPoints("PRIZE2")).toBe(900);
    expect(getExactHitPoints("THREE_FRONT")).toBe(500);
    expect(getExactHitPoints("TWO_DIGIT")).toBe(200);
  });

  test("near miss points apply only to FIRST distance 1", () => {
    expect(
      getNearMissBasePoints({
        digitDistance: 1,
        prizeType: "FIRST",
        segment: "full6"
      })
    ).toBe(FIRST_NEAR_MISS_POINTS);
    expect(
      getNearMissBasePoints({
        digitDistance: 1,
        prizeType: "NEAR_FIRST",
        segment: "full6"
      })
    ).toBe(0);
    expect(
      isScorableNearMiss({
        digitDistance: 1,
        prizeType: "FIRST",
        segment: "full6"
      })
    ).toBe(true);
  });
});
