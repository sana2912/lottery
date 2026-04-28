import type { AnalyticsReadModel } from "@/schema/app/analytics.schema";

export function getTopDigits(analytics: AnalyticsReadModel) {
  return analytics.digitStats.slice(0, 10);
}

export function getTopNumbers(analytics: AnalyticsReadModel) {
  return analytics.numberStats.slice(0, 8);
}

export function toDigitHeatmapCells(analytics: AnalyticsReadModel) {
  return getTopDigits(analytics).map((stat) => ({
    id: `${stat.prizeType}-${stat.position}-${stat.digit}`,
    label: stat.digit,
    value: stat.hitCount
  }));
}

export function toNumberFrequencyPoints(analytics: AnalyticsReadModel) {
  return getTopNumbers(analytics).map((stat) => ({
    id: `${stat.prizeType}-${stat.number}`,
    label: stat.number,
    value: stat.frequencyPercent
  }));
}
