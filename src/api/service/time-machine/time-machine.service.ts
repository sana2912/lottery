import { getPrisma } from "@/api/service/prisma";
import { buildSimulationSummary } from "@/api/service/time-machine/analytics-summary";
import type { SimulationDraw } from "@/api/service/time-machine/near-miss";
import {
  buildSimulationTimeline,
  normalizeSimulationDrawDateIso
} from "@/api/service/time-machine/timeline";
import type {
  TimeMachineSimulationRequest,
  TimeMachineSimulationResponse
} from "@/schema/app/time-machine.schema";

export async function runTimeMachineSimulation(
  input: TimeMachineSimulationRequest
): Promise<TimeMachineSimulationResponse> {
  const prisma = getPrisma();
  const generatedAt = new Date();
  const startDate = new Date(`${input.startYear}-01-01T00:00:00.000Z`);
  const tickets = input.tickets.map((ticket) => ticket.trim());

  const draws = await prisma.lotteryDraw.findMany({
    include: {
      prizes: true
    },
    orderBy: {
      drawDate: "desc"
    },
    where: {
      drawDate: {
        gte: startDate
      },
      lotteryType: input.lotteryType
    }
  });

  const simulationDraws: SimulationDraw[] = draws.map((draw) => ({
    drawDate: draw.drawDate,
    id: draw.id,
    prizes: draw.prizes.map((prize) => ({
      number: prize.number,
      position: prize.position ?? undefined,
      type: prize.type
    }))
  }));

  const timeline = buildSimulationTimeline({
    draws: simulationDraws,
    tickets
  });
  const summary = buildSimulationSummary(timeline);
  const startDateIso = normalizeSimulationDrawDateIso(startDate);
  const endDateIso =
    simulationDraws.length > 0
      ? normalizeSimulationDrawDateIso(simulationDraws[0]?.drawDate ?? generatedAt)
      : startDateIso;

  return {
    meta: {
      drawCount: simulationDraws.length,
      endDateIso,
      generatedAt: generatedAt.toISOString(),
      lotteryType: input.lotteryType,
      startDateIso,
      ticketCount: tickets.length
    },
    summary,
    tickets: tickets.map((number) => ({ number })),
    timeline
  };
}

export const timeMachineService = {
  runTimeMachineSimulation
} as const;

export function runTimeMachineSimulationFromDraws(input: {
  draws: readonly SimulationDraw[];
  lotteryType: TimeMachineSimulationRequest["lotteryType"];
  startYear: number;
  tickets: readonly string[];
}): TimeMachineSimulationResponse {
  const generatedAt = new Date();
  const tickets = input.tickets.map((ticket) => ticket.trim());
  const timeline = buildSimulationTimeline({
    draws: input.draws,
    tickets
  });
  const summary = buildSimulationSummary(timeline);
  const startDateIso = new Date(`${input.startYear}-01-01T00:00:00.000Z`).toISOString();
  const endDateIso =
    input.draws.length > 0
      ? normalizeSimulationDrawDateIso(input.draws[0]?.drawDate ?? generatedAt)
      : startDateIso;

  return {
    meta: {
      drawCount: input.draws.length,
      endDateIso,
      generatedAt: generatedAt.toISOString(),
      lotteryType: input.lotteryType,
      startDateIso,
      ticketCount: tickets.length
    },
    summary,
    tickets: tickets.map((number) => ({ number })),
    timeline
  };
}
