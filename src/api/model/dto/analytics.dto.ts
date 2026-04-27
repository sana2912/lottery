import type { ApiAnalyticsSummary } from "@/schema/api/analytics";

type AnalyticsSummaryDtoInput = {
  drawCount: number;
  generatedAt: Date | string;
};

export function toApiAnalyticsSummary(summary: AnalyticsSummaryDtoInput): ApiAnalyticsSummary {
  return {
    drawCount: summary.drawCount,
    generatedAt:
      summary.generatedAt instanceof Date ? summary.generatedAt.toISOString() : summary.generatedAt
  };
}
