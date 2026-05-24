import { afterEach, describe, expect, test } from "bun:test";
import { createApiRouter } from "@/api/router";
import {
  runTimeMachineSimulationFromDraws,
  timeMachineService
} from "@/api/service/time-machine/time-machine.service";
import { timeMachineSimulationResponseSchema } from "@/schema/app/time-machine.schema";
import { simulationFixtureDraws } from "../time-machine/fixtures/simulation-draws";

const mutableTimeMachineService = timeMachineService as {
  runTimeMachineSimulation: typeof timeMachineService.runTimeMachineSimulation;
};

const originalRunSimulation = timeMachineService.runTimeMachineSimulation;

afterEach(() => {
  mutableTimeMachineService.runTimeMachineSimulation = originalRunSimulation;
});

describe("time-machine api router", () => {
  test("POST /api/time-machine/simulations rejects 0 tickets", async () => {
    const response = await createApiRouter().fetch(
      new Request("http://localhost/api/time-machine/simulations", {
        body: JSON.stringify({
          lotteryType: "THAI_GOVERNMENT",
          startYear: 1992,
          tickets: []
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(400);
  });

  test("POST /api/time-machine/simulations rejects more than 4 tickets", async () => {
    const response = await createApiRouter().fetch(
      new Request("http://localhost/api/time-machine/simulations", {
        body: JSON.stringify({
          lotteryType: "THAI_GOVERNMENT",
          startYear: 1992,
          tickets: ["123456", "234567", "345678", "456789", "567890"]
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(400);
  });

  test("POST /api/time-machine/simulations returns compact events from 1992 onward", async () => {
    let receivedInput: unknown;

    mutableTimeMachineService.runTimeMachineSimulation = async (input) => {
      receivedInput = input;

      return runTimeMachineSimulationFromDraws({
        draws: simulationFixtureDraws,
        lotteryType: input.lotteryType,
        startYear: input.startYear,
        tickets: input.tickets
      });
    };

    const response = await createApiRouter().fetch(
      new Request("http://localhost/api/time-machine/simulations", {
        body: JSON.stringify({
          lotteryType: "THAI_GOVERNMENT",
          startYear: 1992,
          tickets: ["123456", "999998"]
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(receivedInput).toEqual({
      lotteryType: "THAI_GOVERNMENT",
      startYear: 1992,
      tickets: ["123456", "999998"]
    });

    const payload = timeMachineSimulationResponseSchema.parse(await response.json());

    expect(payload.meta.startDateIso).toContain("1992");
    expect(payload.timeline.length).toBe(simulationFixtureDraws.length);
    expect(payload.timeline[0]?.drawPrizes.length).toBeGreaterThan(0);
    expect(payload.summary.hitCounts.total).toBeGreaterThan(0);
    expect(payload.timeline.some((event) => event.nearMiss)).toBe(true);
  });

  test("POST /api/time-machine/simulations returns stable fixture output", async () => {
    mutableTimeMachineService.runTimeMachineSimulation = async (input) =>
      runTimeMachineSimulationFromDraws({
        draws: simulationFixtureDraws,
        lotteryType: input.lotteryType,
        startYear: input.startYear,
        tickets: input.tickets
      });

    const requestBody = {
      lotteryType: "THAI_GOVERNMENT",
      startYear: 1992,
      tickets: ["123456", "999998"]
    };

    const request = new Request("http://localhost/api/time-machine/simulations", {
      body: JSON.stringify(requestBody),
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    });

    const first = timeMachineSimulationResponseSchema.parse(
      await (await createApiRouter().fetch(request)).json()
    );
    const second = timeMachineSimulationResponseSchema.parse(
      await (
        await createApiRouter().fetch(
          new Request("http://localhost/api/time-machine/simulations", {
            body: JSON.stringify(requestBody),
            headers: {
              "content-type": "application/json"
            },
            method: "POST"
          })
        )
      ).json()
    );

    expect(first.timeline.map((event) => event.kind)).toEqual(
      second.timeline.map((event) => event.kind)
    );
    expect(first.summary.totalScore).toBe(second.summary.totalScore);
    expect(first.summary.hitCounts).toEqual(second.summary.hitCounts);
  });
});
