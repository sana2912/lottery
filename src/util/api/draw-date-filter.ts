import type { DateTimeFilter } from "@/generated/prisma/commonInputTypes";

export type DrawDateRangeInput = {
  capEndAtNow?: boolean;
  endDate?: string;
  month?: number;
  startDate?: string;
  year?: number;
};

export function buildYearMonthRange(
  year: number | undefined,
  month: number | undefined
): { end: Date; start: Date } | undefined {
  if (!year) {
    return undefined;
  }

  if (!month) {
    return {
      end: new Date(Date.UTC(year + 1, 0, 1)),
      start: new Date(Date.UTC(year, 0, 1))
    };
  }

  return {
    end: new Date(Date.UTC(year, month, 1)),
    start: new Date(Date.UTC(year, month - 1, 1))
  };
}

export function buildDrawDateFilter(
  input: DrawDateRangeInput
): DateTimeFilter<"LotteryDraw"> | undefined {
  const filter: DateTimeFilter<"LotteryDraw"> = {};
  const yearMonthRange = buildYearMonthRange(input.year, input.month);

  if (yearMonthRange) {
    filter.gte = yearMonthRange.start;
    filter.lt = yearMonthRange.end;
  }

  if (input.startDate) {
    filter.gte = new Date(input.startDate);
  }

  if (input.endDate) {
    filter.lte = new Date(input.endDate);
  } else if (input.capEndAtNow) {
    filter.lte = new Date();
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}
