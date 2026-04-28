import { describe, expect, mock, test } from "bun:test";
import {
  appendQueryString,
  getSearchParams,
  parseQuery,
  searchParamsToObject,
  toSearchParams
} from "@/util/api/query";

describe("toSearchParams", () => {
  test("serializes scalars, arrays, and dates while skipping empty values", () => {
    const searchParams = toSearchParams({
      archived: false,
      empty: "",
      endDate: undefined,
      page: 4,
      startDate: new Date("2026-04-29T12:00:00.000Z"),
      tags: ["hot", null, "cold"]
    });

    expect(searchParams.toString()).toBe(
      "archived=false&page=4&startDate=2026-04-29T12%3A00%3A00.000Z&tags=hot&tags=cold"
    );
  });
});

describe("appendQueryString", () => {
  test("appends query strings to plain and pre-existing query paths", () => {
    expect(appendQueryString("/api/draws", { page: 2, q: "123" })).toBe("/api/draws?page=2&q=123");
    expect(appendQueryString("/api/draws?scope=global", { page: 2 })).toBe(
      "/api/draws?scope=global&page=2"
    );
  });
});

describe("getSearchParams", () => {
  test("reads search params from string, URL, and Request inputs", () => {
    expect(getSearchParams("/api/draws?page=3").get("page")).toBe("3");
    expect(getSearchParams(new URL("https://example.com/api/draws?q=09")).get("q")).toBe("09");
    expect(getSearchParams(new Request("https://example.com/api/draws?month=4")).get("month")).toBe(
      "4"
    );
  });
});

describe("searchParamsToObject", () => {
  test("converts repeated keys to arrays and single keys to strings", () => {
    const searchParams = new URLSearchParams();

    searchParams.append("page", "1");
    searchParams.append("tag", "hot");
    searchParams.append("tag", "cold");

    expect(searchParamsToObject(searchParams)).toEqual({
      page: "1",
      tag: ["hot", "cold"]
    });
  });
});

describe("parseQuery", () => {
  test("passes normalized query objects to the parser", () => {
    const parser = {
      parse: mock((value: unknown) => ({
        ok: true,
        value
      }))
    };

    const response = parseQuery(
      "https://example.com/api/analytics?digit=0&tag=hot&tag=cold",
      parser
    );

    expect(parser.parse).toHaveBeenCalledTimes(1);
    expect(parser.parse).toHaveBeenCalledWith({
      digit: "0",
      tag: ["hot", "cold"]
    });
    expect(response).toEqual({
      ok: true,
      value: {
        digit: "0",
        tag: ["hot", "cold"]
      }
    });
  });

  test("accepts URLSearchParams directly", () => {
    const parser = {
      parse: mock((value: unknown) => value)
    };
    const searchParams = new URLSearchParams("lotteryType=THAI_GOVERNMENT&windowSize=120");

    const response = parseQuery(searchParams, parser);

    expect(parser.parse).toHaveBeenCalledWith({
      lotteryType: "THAI_GOVERNMENT",
      windowSize: "120"
    });
    expect(response).toEqual({
      lotteryType: "THAI_GOVERNMENT",
      windowSize: "120"
    });
  });
});
