import { describe, expect, test } from "bun:test";
import {
  getPrizeTypesForSampleQuery,
  matchesAnalysisPrizeSample
} from "@/api/service/analysis-snapshot/prize-sample-types";

describe("prize-sample-types", () => {
  test("THREE_FRONT accepts native and grouped rows", () => {
    expect(getPrizeTypesForSampleQuery("THREE_FRONT")).toEqual(["THREE_FRONT", "THREE_DIGIT"]);
    expect(
      matchesAnalysisPrizeSample({ position: 1, type: "THREE_DIGIT" }, { prizeType: "THREE_FRONT" })
    ).toBe(true);
    expect(
      matchesAnalysisPrizeSample({ position: 2, type: "THREE_DIGIT" }, { prizeType: "THREE_FRONT" })
    ).toBe(false);
  });

  test("THREE_BACK accepts grouped position 2", () => {
    expect(
      matchesAnalysisPrizeSample({ position: 2, type: "THREE_DIGIT" }, { prizeType: "THREE_BACK" })
    ).toBe(true);
  });
});
