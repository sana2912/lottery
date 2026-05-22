import { describe, expect, test } from "bun:test";
import { hasNumberShapeFlag } from "@/lib/app/number-shape";
import { generateRandomPatternNumbers } from "@/lib/app/pattern-random-examples";

describe("generateRandomPatternNumbers", () => {
  test("returns unique padded numbers that match the predicate", () => {
    const numbers = generateRandomPatternNumbers({
      count: 8,
      length: 3,
      matches: (number) => hasNumberShapeFlag(number, "all_unique"),
      seed: "test-all-unique"
    });

    expect(numbers).toHaveLength(8);
    expect(new Set(numbers).size).toBe(8);
    expect(numbers.every((number) => number.length === 3)).toBe(true);
    expect(numbers.every((number) => hasNumberShapeFlag(number, "all_unique"))).toBe(true);
  });

  test("produces different sets when seed changes", () => {
    const left = generateRandomPatternNumbers({
      count: 6,
      length: 2,
      matches: (number) => hasNumberShapeFlag(number, "ascending"),
      seed: "seed-a"
    });
    const right = generateRandomPatternNumbers({
      count: 6,
      length: 2,
      matches: (number) => hasNumberShapeFlag(number, "ascending"),
      seed: "seed-b"
    });

    expect(left).not.toEqual(right);
  });
});
