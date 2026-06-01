import { afterEach, describe, expect, test } from "bun:test";
import { createApiRouter } from "@/api/router";
import { createSeededLotterySurvivalRng } from "@/api/service/lottery-survival/generator";
import {
  lotterySurvivalService,
  runLotterySurvivalRoundFromDraws
} from "@/api/service/lottery-survival/lottery-survival.service";
import { lotterySurvivalRoundResponseSchema } from "@/schema/app/lottery-survival.schema";

const mutableLotterySurvivalService = lotterySurvivalService as {
  runLotterySurvivalRound: typeof lotterySurvivalService.runLotterySurvivalRound;
};

const originalRunLotterySurvivalRound = lotterySurvivalService.runLotterySurvivalRound;

afterEach(() => {
  mutableLotterySurvivalService.runLotterySurvivalRound = originalRunLotterySurvivalRound;
});

describe("lottery-survival api router", () => {
  test("POST /api/lottery-survival/rounds rejects missing favorite digits", async () => {
    const response = await createApiRouter().fetch(
      new Request("http://localhost/api/lottery-survival/rounds", {
        body: JSON.stringify({
          balanceBefore: 800_000,
          roundIndex: 1,
          strategy: "favorite"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(400);
  });

  test("POST /api/lottery-survival/rounds returns schema-valid round output", async () => {
    mutableLotterySurvivalService.runLotterySurvivalRound = async (input) =>
      runLotterySurvivalRoundFromDraws({
        draws: [
          {
            drawDate: "2026-04-16T00:00:00.000Z",
            id: "draw-1",
            prizes: [
              { number: "123456", type: "FIRST" },
              { number: "56", type: "TWO_DIGIT" }
            ],
            sourceStatus: "VERIFIED"
          }
        ],
        input,
        rng: createSeededLotterySurvivalRng("router-round")
      });

    const response = await createApiRouter().fetch(
      new Request("http://localhost/api/lottery-survival/rounds", {
        body: JSON.stringify({
          balanceBefore: 1_600,
          manualTickets: ["123456"],
          roundIndex: 1,
          strategy: "random"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    const payload = lotterySurvivalRoundResponseSchema.parse(await response.json());

    expect(payload.roundIndex).toBe(1);
    expect(payload.ticketCount).toBe(20);
    expect(payload.manualCount).toBe(1);
    expect(payload.draw.prizes.length).toBeGreaterThan(0);
    expect(payload.winBreakdown.totalPrizeMoney).toBe(payload.prizeTotal);
    expect(payload.winBreakdown.totalRawWinningMatches).toBeGreaterThan(0);
  });
});
