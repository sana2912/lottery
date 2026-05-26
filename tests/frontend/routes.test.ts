import { describe, expect, test } from "bun:test";
import CalendarRoute from "@/app/(user)/calendar/page";
import AnalyticsRoute from "@/frontend/pages/analytics/route";
import CompareRoute from "@/frontend/pages/compare/route";
import ResultsRoute from "@/frontend/pages/results/route";
import TimeMachineRoute from "@/frontend/pages/time-machine/route";

function assertReactElement(value: unknown) {
  expect(value).toBeTruthy();
  expect(typeof value).toBe("object");
  expect((value as { props?: unknown }).props).toBeDefined();
}

describe("route wrappers", () => {
  test("CalendarRoute awaits searchParams and passes them through", async () => {
    const element = await CalendarRoute({
      searchParams: Promise.resolve({ month: "5", prizeType: "FIRST" })
    });
    assertReactElement(element);
    expect((element as { props: { searchParams?: unknown } }).props.searchParams).toEqual({
      month: "5",
      prizeType: "FIRST"
    });
  });

  test("AnalyticsRoute awaits searchParams and passes them through", async () => {
    const element = await AnalyticsRoute({
      searchParams: Promise.resolve({ page: "2" })
    });
    assertReactElement(element);
    expect((element as { props: { searchParams?: unknown } }).props.searchParams).toEqual({
      page: "2"
    });
  });

  test("CompareRoute awaits searchParams and passes them through", async () => {
    const element = await CompareRoute({
      searchParams: Promise.resolve({ windowSize: "120" })
    });
    assertReactElement(element);
    expect((element as { props: { searchParams?: unknown } }).props.searchParams).toEqual({
      windowSize: "120"
    });
  });

  test("ResultsRoute awaits searchParams and passes them through", async () => {
    const element = await ResultsRoute({
      searchParams: Promise.resolve({ q: "foo" })
    });
    assertReactElement(element);
    expect((element as { props: { searchParams?: unknown } }).props.searchParams).toEqual({
      q: "foo"
    });
  });

  test("TimeMachineRoute renders the page wrapper", async () => {
    const element = await TimeMachineRoute();
    assertReactElement(element);
  });
});
