import type { ResultsContent } from "@/frontend/pages/results/results.content";
import type { Draw, DrawListResponse } from "@/schema/app/draw.schema";
import type { ResultsReadModel } from "@/schema/app/results.schema";

export function toResultsModel(
  response: DrawListResponse,
  fallback: ResultsReadModel,
  content: ResultsContent
): ResultsReadModel {
  const latestDraw = response.draws[0];
  const prizeCount = response.draws.reduce((total, draw) => total + draw.prizes.length, 0);

  return {
    ...fallback,
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

export function getMockDraw(id: string, fallback: ResultsReadModel): Draw | null {
  const draw = fallback.draws.find((item) => item.id === id);

  if (!draw) {
    return null;
  }

  return {
    coverage: draw.coverage,
    drawDate: draw.drawDate,
    drawDateIso: draw.drawDateIso,
    drawNo: draw.drawNo,
    id: draw.id,
    lotteryType: draw.lotteryType,
    prizes: draw.prizes.map((prize, index) => ({
      id: `${draw.id}-${prize.prizeType}-${index}`,
      label: prize.label,
      number: prize.value,
      type: prize.prizeType
    })),
    status: draw.status,
    statusLabel: draw.statusLabel,
    sourceStatus: toSourceStatus(draw.status)
  };
}

function toSourceStatus(status: ResultsReadModel["draws"][number]["status"]) {
  if (status === "complete") {
    return "VERIFIED";
  }

  if (status === "partial") {
    return "PARTIAL";
  }

  return "IMPORTED";
}
