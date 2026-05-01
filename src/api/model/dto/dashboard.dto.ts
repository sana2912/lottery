import type { ApiDashboardReadModel } from "@/schema/api/dashboard";

type DashboardDtoInput = Omit<ApiDashboardReadModel, "generatedAt"> & {
  generatedAt: Date | string;
};

export function toApiDashboardReadModel(input: DashboardDtoInput): ApiDashboardReadModel {
  return {
    ...input,
    contractRows: input.contractRows.map((row) => ({ ...row })),
    generatedAt: normalizeDateString(input.generatedAt),
    latestDraw: {
      ...input.latestDraw,
      primaryPrize: { ...input.latestDraw.primaryPrize },
      secondaryPrizes: input.latestDraw.secondaryPrizes.map((prize) => ({ ...prize }))
    },
    metrics: input.metrics.map((metric) => ({ ...metric })),
    predictionSummary: {
      ...input.predictionSummary,
      candidates: input.predictionSummary.candidates.map((candidate) => ({
        ...candidate,
        reasons: [...candidate.reasons]
      }))
    },
    signals: input.signals.map((signal) => ({ ...signal }))
  };
}

function normalizeDateString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}
