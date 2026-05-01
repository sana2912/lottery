import { describe, expect, test } from "bun:test";
import { createSeedFileFromCsvRows } from "@/api/service/draw-seed.service";

describe("draw-seed.service", () => {
  test("maps current detailed CSV rows into explicit prize buckets", () => {
    const seedFile = createSeedFileFromCsvRows(
      [
        {
          draw_date: "2026-04-16",
          draw_date_text: "draw text",
          first_prize: "309612",
          first_prize_digits: "6",
          has_detail_section: "True",
          last2_number: "77",
          last3_numbers: "424|868",
          near_first_prize: "309611|309613",
          prize2_numbers: "097722|175203",
          prize3_numbers: "136798|443166",
          prize4_numbers: "053998|174044",
          prize5_numbers: "006709|262875",
          source_file: "2026-04-16-BE2569.html",
          source_url: "https://example.com/2026-04-16",
          special_first_prize_raw: "",
          year_be: "2569"
        }
      ],
      "results_2022_2026.csv"
    );

    const draw = seedFile.draws[0];

    expect(draw?.sourceStatus).toBe("VERIFIED");
    expect(draw?.prizes).toEqual([
      { number: "309612", position: undefined, type: "FIRST" },
      { number: "424", position: 1, type: "THREE_DIGIT" },
      { number: "868", position: 2, type: "THREE_DIGIT" },
      { number: "77", position: undefined, type: "TWO_DIGIT" },
      { number: "309611", position: 1, type: "NEAR_FIRST" },
      { number: "309613", position: 2, type: "NEAR_FIRST" },
      { number: "097722", position: 1, type: "PRIZE2" },
      { number: "175203", position: 2, type: "PRIZE2" },
      { number: "136798", position: 1, type: "PRIZE3" },
      { number: "443166", position: 2, type: "PRIZE3" },
      { number: "053998", position: 1, type: "PRIZE4" },
      { number: "174044", position: 2, type: "PRIZE4" },
      { number: "006709", position: 1, type: "PRIZE5" },
      { number: "262875", position: 2, type: "PRIZE5" }
    ]);
  });

  test("keeps legacy rows as partial and preserves four-value three-digit sets", () => {
    const seedFile = createSeedFileFromCsvRows(
      [
        {
          draw_date: "1996-12-30",
          draw_date_text: "draw text",
          first_prize: "879454",
          first_prize_digits: "6",
          has_detail_section: "False",
          last2_number: "26",
          last3_numbers: "158|314|584|879",
          near_first_prize: "",
          prize2_numbers: "",
          prize3_numbers: "",
          prize4_numbers: "",
          prize5_numbers: "",
          source_file: "1996-12-30-BE2539.html",
          source_url: "https://example.com/1996-12-30",
          special_first_prize_raw: "",
          year_be: "2539"
        }
      ],
      "results_1992_1996.csv"
    );

    const draw = seedFile.draws[0];

    expect(draw?.sourceStatus).toBe("PARTIAL");
    expect(
      draw?.prizes.filter((prize) => prize.type === "THREE_DIGIT").map((prize) => prize.number)
    ).toEqual(["158", "314", "584", "879"]);
  });

  test("drops placeholder values instead of importing fake prize numbers", () => {
    const seedFile = createSeedFileFromCsvRows(
      [
        {
          draw_date: "2026-05-02",
          draw_date_text: "draw text",
          first_prize: "xxxxxx",
          first_prize_digits: "6",
          has_detail_section: "True",
          last2_number: "xx",
          last3_numbers: "",
          near_first_prize: "xxxxxx|xxxxxx",
          prize2_numbers: "xxxxxx|xxxxxx",
          prize3_numbers: "",
          prize4_numbers: "",
          prize5_numbers: "",
          source_file: "2026-05-02-BE2569.html",
          source_url: "https://example.com/2026-05-02",
          special_first_prize_raw: "",
          year_be: "2569"
        }
      ],
      "results_2022_2026.csv"
    );

    expect(seedFile.draws[0]?.sourceStatus).toBe("IMPORTED");
    expect(seedFile.draws[0]?.prizes).toEqual([]);
  });
});
