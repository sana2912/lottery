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
    computedAt: normalizeDateString(stat.computedAt),
    digit: stat.digit,
    drawCount: stat.drawCount,
    frequencyPercent: stat.frequencyPercent,
    hitCount: stat.hitCount,
    lastSeenDrawDate: stat.lastSeenDrawDate
      ? normalizeDateString(stat.lastSeenDrawDate)
      : undefined,
    lotteryType: stat.lotteryType,
    missingDrawCount: stat.missingDrawCount,
    position: stat.position,
    prizeType: stat.prizeType,
    trendDirection: stat.trendDirection,
    windowSize: stat.windowSize
  };
}

export function toApiNumberStat(stat: NumberStatDtoInput): ApiNumberStat {
  return {
    computedAt: normalizeDateString(stat.computedAt),
    drawCount: stat.drawCount,
    frequencyPercent: stat.frequencyPercent,
    hitCount: stat.hitCount,
    lastSeenDrawDate: stat.lastSeenDrawDate
      ? normalizeDateString(stat.lastSeenDrawDate)
      : undefined,
    lotteryType: stat.lotteryType,
    averageGap: stat.averageGap,
    maxGap: stat.maxGap,
    missingDrawCount: stat.missingDrawCount,
    number: stat.number,
    numberLength: stat.numberLength,
    patternFlags: [...stat.patternFlags],
    prizeType: stat.prizeType,
    trendScore: stat.trendScore,
    windowSize: stat.windowSize
  };
}

export function toApiPatternSummary(summary: ApiPatternSummary): ApiPatternSummary {
  return {
    frequencyPercent: summary.frequencyPercent,
    hitCount: summary.hitCount,
    id: summary.id,
    insight: summary.insight,
    label: summary.label,
    pattern: summary.pattern,
    sampleSize: summary.sampleSize
  };
}

export function toApiAnalyticsReadModel(model: AnalyticsReadModelDtoInput): ApiAnalyticsReadModel {
  console.time("analytics.dto conversion");

  try {
    return {
      generatedAt: normalizeDateString(model.generatedAt),
      source: model.source,
      summary: toApiAnalyticsSummary(model.summary),
      digitStats: model.digitStats.map(toApiDigitStat),
      numberStats: model.numberStats.map(toApiNumberStat),
      patternSummaries: model.patternSummaries.map(toApiPatternSummary)
    };
  } finally {
    console.timeEnd("analytics.dto conversion");
  }
}

function normalizeDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
