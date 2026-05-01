import type { ResultsContent } from "@/frontend/pages/results/results.content";
import type { DrawListResponse } from "@/schema/app/draw.schema";
import type { ResultsReadModel } from "@/schema/app/results.schema";

export function toResultsModel(
  response: DrawListResponse,
  shell: ResultsReadModel,
  content: ResultsContent
): ResultsReadModel {
  const latestDraw = response.draws[0];
  const prizeCount = response.draws.reduce((total, draw) => total + draw.prizes.length, 0);

  return {
    ...shell,
    draws: response.draws.map((draw) => ({
      coverage: draw.coverage,
      drawDate: draw.drawDate,
      drawDateIso: draw.drawDateIso,
      drawNo: draw.drawNo,
      id: draw.id,
      lotteryType: draw.lotteryType,
      prizes: draw.prizes.map((prize) => ({
        label: prize.label,
        prizeType: prize.type,
        value: prize.number
      })),
      status: draw.status,
      statusLabel: draw.statusLabel
    })),
    generatedAt: response.generatedAt,
    mockNote: response.draws.length > 0 ? content.fallbackNotes.ready : content.fallbackNotes.empty,
    source: response.source,
    stats: [
      {
        hint: content.stats.latestDrawHint,
        label: content.stats.latestDrawLabel,
        value: latestDraw?.drawDate ?? "-"
      },
      {
        hint: content.stats.drawRecordsHint,
        label: content.stats.drawRecordsLabel,
        value: String(response.pagination.total)
      },
      {
        hint: content.stats.prizeRecordsHint,
        label: content.stats.prizeRecordsLabel,
        value: String(prizeCount)
      }
    ]
  };
}

export function toResultsShellModel(shell: ResultsReadModel, note: string): ResultsReadModel {
  return {
    ...shell,
    draws: [],
    generatedAt: new Date().toISOString(),
    mockNote: note,
    source: "mock",
    stats: shell.stats.map((stat, index) => ({
      ...stat,
      value: index === 0 ? "-" : "0"
    }))
  };
}
