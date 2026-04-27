import type {
  ApiAnalyticsReadModel,
  ApiAnalyticsSummary,
  ApiDigitStat,
  ApiNumberStat,
  ApiPatternSummary
} from "@/schema/api/analytics";

type AnalyticsSummaryDtoInput = {
  drawCount: number;
  generatedAt: Date | string;
};

type DigitStatDtoInput = Omit<ApiDigitStat, "computedAt" | "lastSeenDrawDate"> & {
  computedAt: Date | string;
  lastSeenDrawDate?: Date | string;
};

type NumberStatDtoInput = Omit<
  ApiNumberStat,
  "computedAt" | "lastSeenDrawDate" | "patternFlags"
> & {
  computedAt: Date | string;
  lastSeenDrawDate?: Date | string;
  patternFlags: readonly ApiNumberStat["patternFlags"][number][];
};

type AnalyticsReadModelDtoInput = Omit<
  ApiAnalyticsReadModel,
  "digitStats" | "generatedAt" | "numberStats" | "patternSummaries" | "summary"
> & {
  digitStats: readonly DigitStatDtoInput[];
  generatedAt: Date | string;
  numberStats: readonly NumberStatDtoInput[];
  patternSummaries: readonly ApiPatternSummary[];
  summary: AnalyticsSummaryDtoInput;
};

export function toApiAnalyticsSummary(summary: AnalyticsSummaryDtoInput): ApiAnalyticsSummary {
  return {
    drawCount: summary.drawCount,
    generatedAt:
      summary.generatedAt instanceof Date ? summary.generatedAt.toISOString() : summary.generatedAt
  };
}

export function toApiDigitStat(stat: DigitStatDtoInput): ApiDigitStat {
  return {
    ...stat,
    computedAt: normalizeDateString(stat.computedAt),
    lastSeenDrawDate: stat.lastSeenDrawDate ? normalizeDateString(stat.lastSeenDrawDate) : undefined
  };
}

export function toApiNumberStat(stat: NumberStatDtoInput): ApiNumberStat {
  return {
    ...stat,
    computedAt: normalizeDateString(stat.computedAt),
    lastSeenDrawDate: stat.lastSeenDrawDate
      ? normalizeDateString(stat.lastSeenDrawDate)
      : undefined,
    patternFlags: [...stat.patternFlags]
  };
}

export function toApiPatternSummary(summary: ApiPatternSummary): ApiPatternSummary {
  return { ...summary };
}

export function toApiAnalyticsReadModel(model: AnalyticsReadModelDtoInput): ApiAnalyticsReadModel {
  return {
    generatedAt: normalizeDateString(model.generatedAt),
    source: model.source,
    summary: toApiAnalyticsSummary(model.summary),
    digitStats: model.digitStats.map(toApiDigitStat),
    numberStats: model.numberStats.map(toApiNumberStat),
    patternSummaries: model.patternSummaries.map(toApiPatternSummary)
  };
}

function normalizeDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
