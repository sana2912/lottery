import {
  type AnalysisContext,
  type AnalysisMonth,
  type AnalysisWindowPreset,
  createAnalysisContext,
  getAnalysisContextKey,
  getAnalysisPrizeNumberLength,
  isAnalysisPrizeType,
  isAnalysisWindowPreset
} from "@/api/service/analysis-snapshot/analysis-context";
import type { AnalysisCalendarHeatmapReadModel } from "@/api/service/analysis-snapshot/calendar-heatmap-read-model";
import { getPrisma } from "@/api/service/prisma";
import type { ApiAnalyticsReadModel } from "@/schema/api/analytics";
import type { ApiPatternsReadModel } from "@/schema/api/patterns";
import { analyticsReadModelSchema } from "@/schema/app/analytics.schema";
import type { CalendarHeatmapQuery } from "@/schema/app/calendar.schema";
import { analysisPatternReadModelSchema } from "@/schema/app/patterns.schema";
import type { FilterContext } from "@/schema/app/query.schema";

type AnalysisSnapshotRow = {
  analyticsReadModel: unknown;
  calendarReadModel: unknown;
  computedAt: Date;
  patternReadModel: unknown;
};

type AnalysisSnapshotAnalyticsRow = {
  analyticsReadModel: unknown;
};

type AnalysisSnapshotPatternRow = {
  computedAt: Date;
  patternReadModel: unknown;
  sampleDrawCount: number;
  windowSize: number | null;
};

export async function getAnalysisSnapshotAnalyticsReadModel(query: FilterContext) {
  const context = getAnalysisContextForFilterQuery(query);

  if (!context) {
    return null;
  }

  const snapshot = await getAnalysisSnapshotAnalyticsRow(context);
  const parsed = analyticsReadModelSchema.safeParse(snapshot?.analyticsReadModel);

  return parsed.success ? (parsed.data satisfies ApiAnalyticsReadModel) : null;
}

export async function getAnalysisSnapshotPatternReadModel(
  query: FilterContext
): Promise<ApiPatternsReadModel | null> {
  const context = getAnalysisContextForFilterQuery(query);

  if (!context) {
    return null;
  }

  const snapshot = await getAnalysisSnapshotPatternRow(context);
  const parsed = analysisPatternReadModelSchema.safeParse(snapshot?.patternReadModel);

  if (!snapshot || !parsed.success) {
    return null;
  }

  const generatedAt = snapshot.computedAt.toISOString();

  return {
    context: {
      lotteryType: context.lotteryType,
      month: context.month,
      numberLength: context.numberLength,
      prizeType: context.prizeType,
      scope: context.scope,
      windowPreset: context.windowPreset,
      windowSize: snapshot.windowSize ?? snapshot.sampleDrawCount
    },
    generatedAt,
    pattern: parsed.data,
    source: "snapshot",
    summary: {
      drawCount: snapshot.sampleDrawCount,
      generatedAt
    }
  };
}

export async function getAnalysisSnapshotCalendarReadModel(query: CalendarHeatmapQuery, now: Date) {
  const context = getAnalysisContextForCalendarQuery(query, now);

  if (!context) {
    return null;
  }

  const snapshot = await getAnalysisSnapshot(context);

  return isAnalysisCalendarHeatmapReadModel(snapshot?.calendarReadModel)
    ? snapshot.calendarReadModel
    : null;
}

export function getAnalysisContextForFilterQuery(query: FilterContext): AnalysisContext | null {
  if (!query.prizeType || !isAnalysisPrizeType(query.prizeType)) {
    return null;
  }

  if (query.startDate || query.endDate || query.year || query.q) {
    return null;
  }

  const windowPreset = query.windowPreset ?? toAnalysisWindowPreset(query.windowSize);

  if (!windowPreset) {
    return null;
  }

  const expectedNumberLength = getAnalysisPrizeNumberLength(query.prizeType);

  if (query.numberLength !== undefined && query.numberLength !== expectedNumberLength) {
    return null;
  }

  const scope = query.scope ?? (query.month ? "MONTH" : "ALL_TIME");

  if (scope === "MONTH" && !query.month) {
    return null;
  }

  return createAnalysisContext({
    lotteryType: query.lotteryType,
    month: query.month as AnalysisMonth | undefined,
    prizeType: query.prizeType,
    scope,
    windowPreset
  });
}

export function getAnalysisContextForCalendarQuery(
  query: CalendarHeatmapQuery,
  now: Date
): AnalysisContext | null {
  const prizeType = query.prizeType ?? "FIRST";
  const windowPreset = query.windowPreset ?? toAnalysisWindowPreset(query.windowSize ?? 50);
  const scope = query.scope ?? "MONTH";

  if (!isAnalysisPrizeType(prizeType) || !windowPreset) {
    return null;
  }

  return createAnalysisContext({
    month:
      scope === "MONTH" ? ((query.month ?? now.getUTCMonth() + 1) as AnalysisMonth) : undefined,
    prizeType,
    scope,
    windowPreset
  });
}

async function getAnalysisSnapshotAnalyticsRow(
  context: AnalysisContext
): Promise<AnalysisSnapshotAnalyticsRow | null> {
  const prisma = getPrisma();
  const contextKey = getAnalysisContextKey(context);

  try {
    const [snapshot] = await prisma.$queryRaw<AnalysisSnapshotAnalyticsRow[]>`
      SELECT
        "analyticsReadModel"
      FROM "analysis_snapshot_runs"
      WHERE "contextKey" = ${contextKey}
      LIMIT 1
    `;

    return snapshot ?? null;
  } catch {
    return null;
  }
}

async function getAnalysisSnapshotPatternRow(
  context: AnalysisContext
): Promise<AnalysisSnapshotPatternRow | null> {
  const prisma = getPrisma();
  const contextKey = getAnalysisContextKey(context);

  try {
    const [snapshot] = await prisma.$queryRaw<AnalysisSnapshotPatternRow[]>`
      SELECT
        "patternReadModel",
        "sampleDrawCount",
        "windowSize",
        "computedAt"
      FROM "analysis_snapshot_runs"
      WHERE "contextKey" = ${contextKey}
      LIMIT 1
    `;

    return snapshot ?? null;
  } catch {
    return null;
  }
}

async function getAnalysisSnapshot(context: AnalysisContext): Promise<AnalysisSnapshotRow | null> {
  const prisma = getPrisma();
  const contextKey = getAnalysisContextKey(context);

  try {
    const [snapshot] = await prisma.$queryRaw<AnalysisSnapshotRow[]>`
      SELECT
        "analyticsReadModel",
        "patternReadModel",
        "calendarReadModel",
        "computedAt"
      FROM "analysis_snapshot_runs"
      WHERE "contextKey" = ${contextKey}
      LIMIT 1
    `;

    return snapshot ?? null;
  } catch {
    return null;
  }
}

function toAnalysisWindowPreset(windowSize: number): AnalysisWindowPreset | undefined {
  const value = String(windowSize);

  return isAnalysisWindowPreset(value) ? value : undefined;
}

function isAnalysisCalendarHeatmapReadModel(
  value: unknown
): value is AnalysisCalendarHeatmapReadModel {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "heatmapRows" in value && Array.isArray((value as AnalysisCalendarHeatmapReadModel).heatmapRows)
  );
}
