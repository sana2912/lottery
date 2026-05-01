import type { CompareFormState } from "@/frontend/pages/compare/compare.mappers";
import { compareRequestSchema } from "@/schema/app/compare.schema";

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

export function parseCompareSearchParams(
  searchParams: SearchParamsInput,
  fallback: CompareFormState
): CompareFormState {
  const record = toSearchParamRecord(searchParams);
  const numbersValue = record.numbers;
  let numbers: string[] | undefined;

  if (Array.isArray(numbersValue)) {
    numbers = numbersValue;
  } else if (typeof numbersValue === "string") {
    numbers = numbersValue
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
  }
  const parsed = compareRequestSchema.safeParse({
    ...record,
    ...(numbers ? { numbers } : {})
  });

  if (!parsed.success) {
    return fallback;
  }

  return {
    endDate: parsed.data.endDate ?? "",
    lotteryType: parsed.data.lotteryType,
    numberLength: String(parsed.data.numberLength),
    numbers: parsed.data.numbers.join(", "),
    prizeType: parsed.data.prizeType,
    startDate: parsed.data.startDate ?? "",
    strategyId: parsed.data.strategyId,
    windowSize: String(parsed.data.windowSize)
  };
}

export function buildCompareHref(formState: CompareFormState): string {
  const searchParams = new URLSearchParams();

  searchParams.set("lotteryType", formState.lotteryType);
  searchParams.set("numberLength", formState.numberLength);
  searchParams.set("numbers", formState.numbers);
  searchParams.set("strategyId", formState.strategyId);
  searchParams.set("windowSize", formState.windowSize);

  if (formState.prizeType) {
    searchParams.set("prizeType", formState.prizeType);
  }

  if (formState.startDate) {
    searchParams.set("startDate", formState.startDate);
  }

  if (formState.endDate) {
    searchParams.set("endDate", formState.endDate);
  }

  return `/compare?${searchParams.toString()}`;
}

function toSearchParamRecord(searchParams?: SearchParamsInput) {
  if (!searchParams) {
    return {};
  }

  if (searchParams instanceof URLSearchParams) {
    return Object.fromEntries(searchParams.entries());
  }

  return searchParams;
}
