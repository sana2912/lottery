import { describe, expect, test } from "bun:test";
import { hasNumberShapeFlag } from "@/lib/app/number-shape";

describe("number shape sequence flags for patterns", () => {
  test("3-digit strict ascending vs +1 run", () => {
    expect(hasNumberShapeFlag("123", "ascending")).toBe(true);
    expect(hasNumberShapeFlag("123", "ascending_run")).toBe(true);
    expect(hasNumberShapeFlag("135", "ascending")).toBe(true);
    expect(hasNumberShapeFlag("135", "ascending_run")).toBe(false);
    expect(hasNumberShapeFlag("124", "ascending")).toBe(true);
    expect(hasNumberShapeFlag("124", "ascending_run")).toBe(false);
  });

  test("3-digit strict descending", () => {
    expect(hasNumberShapeFlag("987", "descending")).toBe(true);
    expect(hasNumberShapeFlag("987", "descending_run")).toBe(true);
    expect(hasNumberShapeFlag("531", "descending")).toBe(true);
    expect(hasNumberShapeFlag("531", "descending_run")).toBe(false);
  });
});
