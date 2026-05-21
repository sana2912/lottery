import {
  ANALYSIS_ENGINE_VERSION,
  ANALYSIS_WINDOW_PRESET,
  type AnalysisContext,
  type AnalysisMonth,
  createAnalysisContext,
  getAnalysisContextKey,
  getAnalysisPrizeNumberLength,
  isAnalysisPrizeType,
  isAnalysisWindowPreset
} from "@/api/service/analysis-snapshot/analysis-context";
import type { AnalysisCalendarHeatmapReadModel } from "@/api/service/analysis-snapshot/calendar-heatmap-read-model";
import { getPrisma } from "@/api/service/prisma";
import { normalizeProductAnalysisQuery } from "@/lib/app/analysis-product-scope";
import type { ApiAnalyticsReadModel } from "@/schema/api/analytics";
import type { ApiPatternsReadModel } from "@/schema/api/patterns";
import { analyticsReadModelSchema } from "@/schema/app/analytics.schema";
import type { CalendarHeatmapQuery } from "@/schema/app/calendar.schema";
import { analysisPatternReadModelSchema } from "@/schema/app/patterns.schema";
import type { FilterContext } from "@/schema/app/query.schema";

type AnalysisSnapshotRow = {
  calendarReadModel: unknown;
  invalidPrizeCount: number;
  sampleDrawCount: number;
  samplePrizeCount: number;
  windowSize: number | null;
};

type AnalysisSnapshotAnalyticsRow = {
  analyticsReadModel: unknown;
  sampleDrawCount: number;
  samplePrizeCount: number;
  windowSize: number | null;
};

type AnalysisSnapshotPatternRow = {
  computedAt: Date;
  patternReadModel: unknown;
  sampleDrawCount: number;
  samplePrizeCount: number;
  windowSize: number | null;
};

export async function getAnalysisSnapshotAnalyticsReadModel(query: FilterContext) {
  const context = getAnalysisContextForFilterQuery(query);

  if (!context) {
    return null;
  }

  const snapshot = await getAnalysisSnapshotAnalyticsRow(context);
  const parsed = analyticsReadModelSchema.safeParse(snapshot?.analyticsReadModel);

  if (!snapshot || !parsed.success || !isAnalyticsSnapshotMetadataCurrent(parsed.data, snapshot)) {
    return null;
  }

  return parsed.data satisfies ApiAnalyticsReadModel;
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

  const expectedWindowSize = snapshot.windowSize ?? snapshot.sampleDrawCount;

  if (
    parsed.data.sampleSize !== snapshot.samplePrizeCount ||
    snapshot.windowSize !== snapshot.sampleDrawCount
  ) {
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
      year: context.year,
      windowPreset: context.windowPreset,
      windowSize: expectedWindowSize
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

  if (!snapshot || !isAnalysisCalendarHeatmapReadModel(snapshot.calendarReadModel)) {
    return null;
  }

  return isCalendarSnapshotMetadataCurrent(snapshot.calendarReadModel, snapshot)
    ? snapshot.calendarReadModel
    : null;
}

export function getAnalysisContextForFilterQuery(query: FilterContext): AnalysisContext | null {
  if (query.windowPreset && !isAnalysisWindowPreset(query.windowPreset)) {
    return null;
  }

  const normalized = normalizeProductAnalysisQuery(query);

  if (!normalized.prizeType || !isAnalysisPrizeType(normalized.prizeType)) {
    return null;
  }

  if (normalized.startDate || normalized.endDate || normalized.q) {
    return null;
  }

  const expectedNumberLength = getAnalysisPrizeNumberLength(normalized.prizeType);

  if (normalized.numberLength !== undefined && normalized.numberLength !== expectedNumberLength) {
    return null;
  }

  if (normalized.scope === "MONTH" && !normalized.month) {
    return null;
  }

  return createAnalysisContext({
    lotteryType: normalized.lotteryType,
    month: normalized.month as AnalysisMonth | undefined,
    prizeType: normalized.prizeType,
    scope: normalized.scope,
    windowPreset: ANALYSIS_WINDOW_PRESET
  });
}

export function getAnalysisContextForCalendarQuery(
  query: CalendarHeatmapQuery,
  now: Date
): AnalysisContext | null {
  const prizeType = query.prizeType ?? "FIRST";
  const scope = query.scope ?? "MONTH";

  if (!isAnalysisPrizeType(prizeType)) {
    return null;
  }

  if (query.windowPreset && !isAnalysisWindowPreset(query.windowPreset)) {
    return null;
  }

  const month =
    scope === "MONTH" ? ((query.month ?? now.getUTCMonth() + 1) as AnalysisMonth) : undefined;

  return createAnalysisContext({
    month,
    prizeType,
    scope,
    windowPreset: ANALYSIS_WINDOW_PRESET
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
        "analyticsReadModel",
        "sampleDrawCount",
        "samplePrizeCount",
        "windowSize"
      FROM "analysis_snapshot_runs"
      WHERE
        "contextKey" = ${contextKey}
        AND "engineVersion" = ${ANALYSIS_ENGINE_VERSION}
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
        "samplePrizeCount",
        "windowSize",
        "computedAt"
      FROM "analysis_snapshot_runs"
      WHERE
        "contextKey" = ${contextKey}
        AND "engineVersion" = ${ANALYSIS_ENGINE_VERSION}
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
        "calendarReadModel",
        "sampleDrawCount",
        "samplePrizeCount",
        "invalidPrizeCount",
        "windowSize"
      FROM "analysis_snapshot_runs"
      WHERE
        "contextKey" = ${contextKey}
        AND "engineVersion" = ${ANALYSIS_ENGINE_VERSION}
      LIMIT 1
    `;

    return snapshot ?? null;
  } catch {
    return null;
  }
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

function isAnalyticsSnapshotMetadataCurrent(
  model: ApiAnalyticsReadModel,
  snapshot: AnalysisSnapshotAnalyticsRow
) {
  const expectedWindowSize = snapshot.windowSize ?? snapshot.sampleDrawCount;

  return (
    snapshot.windowSize === snapshot.sampleDrawCount &&
    model.summary.drawCount === snapshot.sampleDrawCount &&
    model.summary.prizeCount === snapshot.samplePrizeCount &&
    (snapshot.samplePrizeCount === 0 || model.numberStats.length > 0) &&
    model.digitStats.every(
      (stat) =>
        stat.drawCount === snapshot.sampleDrawCount && stat.windowSize === expectedWindowSize
    ) &&
    model.numberStats.every(
      (stat) =>
        stat.drawCount === snapshot.sampleDrawCount &&
        stat.windowSize === expectedWindowSize &&
        stat.samplePrizeCount === snapshot.samplePrizeCount
    )
  );
}

function isCalendarSnapshotMetadataCurrent(
  model: AnalysisCalendarHeatmapReadModel,
  snapshot: AnalysisSnapshotRow
) {
  return (
    snapshot.windowSize === snapshot.sampleDrawCount &&
    model.drawCount === snapshot.sampleDrawCount &&
    model.invalidPrizeCount === snapshot.invalidPrizeCount &&
    model.prizeCount === snapshot.samplePrizeCount &&
    model.sampleSize === snapshot.sampleDrawCount
  );
}
