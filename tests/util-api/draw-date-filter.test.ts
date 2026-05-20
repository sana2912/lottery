import { describe, expect, test } from "bun:test";
import { buildDrawDateFilter, buildYearMonthRange } from "@/util/api/draw-date-filter";

describe("draw-date-filter", () => {
  test("buildYearMonthRange for a calendar month", () => {
    const range = buildYearMonthRange(2024, 5);

    expect(range?.start.toISOString()).toBe("2024-05-01T00:00:00.000Z");
    expect(range?.end.toISOString()).toBe("2024-06-01T00:00:00.000Z");
  });

  test("caps analytics queries at now when requested", () => {
    const filter = buildDrawDateFilter({ capEndAtNow: true });

    expect(filter?.lte).toBeInstanceOf(Date);
  });
});
