import type { ApiCompareCandidate, ApiCompareReadModel } from "@/schema/api/compare";

type CompareCandidateDtoInput = Omit<ApiCompareCandidate, "reasons"> & {
  reasons: readonly string[];
};

type CompareReadModelDtoInput = Omit<ApiCompareReadModel, "candidates" | "generatedAt"> & {
  candidates: readonly CompareCandidateDtoInput[];
  generatedAt: Date | string;
};

export function toApiCompareCandidate(candidate: CompareCandidateDtoInput): ApiCompareCandidate {
  return {
    ...candidate,
    reasons: [...candidate.reasons],
    scoreBreakdown: { ...candidate.scoreBreakdown }
  };
}

export function toApiCompareReadModel(model: CompareReadModelDtoInput): ApiCompareReadModel {
  return {
    candidates: model.candidates.map(toApiCompareCandidate),
    generatedAt: normalizeDateString(model.generatedAt),
    sampleSize: model.sampleSize,
    source: model.source,
    strongestSignal: model.strongestSignal
  };
}

function normalizeDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
