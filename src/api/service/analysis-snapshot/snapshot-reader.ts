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
import { Prisma } from "@/generated/prisma/client";
import { normalizeProductAnalysisQuery } from "@/lib/app/analysis-product-scope";
import type {
  ApiAnalyticsReadModel,
  ApiDigitStat,
  ApiNumberStat,
  ApiPatternFlag
} from "@/schema/api/analytics";
import type { ApiPatternsReadModel } from "@/schema/api/patterns";
import { analyticsReadModelSchema } from "@/schema/app/analytics.schema";
import type { CalendarHeatmapQuery } from "@/schema/app/calendar.schema";
import { analysisPatternReadModelSchema } from "@/schema/app/patterns.schema";
import type { FilterContext } from "@/schema/app/query.schema";

type AnalysisSnapshotRow = {
  calendarReadModelBytes: number | null;
  calendarReadModel: unknown;
  invalidPrizeCount: number;
  sampleDrawCount: number;
  samplePrizeCount: number;
  windowSize: number | null;
};

type AnalysisSnapshotAnalyticsRow = {
  analyticsReadModelBytes: number | null;
  analyticsReadModel: unknown;
  sampleDrawCount: number;
  samplePrizeCount: number;
  windowSize: number | null;
};

type AnalysisSnapshotStatRunRow = {
  runId: string;
  sampleDrawCount: number;
  samplePrizeCount: number;
  windowSize: number | null;
};

type AnalysisSnapshotDigitRow = {
  computedAt: Date | string;
  digit: string;
  drawCount: number;
  frequencyPercent: number;
  hitCount: number;
  lastSeenDrawDate: Date | string | null;
  lotteryType: string;
  missingDrawCount: number;
  position: number | null;
  prizeType: string;
  trendDirection: ApiDigitStat["trendDirection"];
};

type AnalysisSnapshotNumberRow = {
  averageGap: number | null;
  computedAt: Date | string;
  drawCount: number;
  frequencyPercent: number;
  hitCount: number;
  lastSeenDrawDate: Date | string | null;
  lotteryType: string;
  maxGap: number | null;
  missingDrawCount: number;
  number: string;
  numberLength: number;
  patternFlags: unknown;
  prizeType: string;
  trendScore: number;
};

type AnalysisSnapshotPatternRow = {
  computedAt: Date;
  patternReadModelBytes: number | null;
  patternReadModel: unknown;
  sampleDrawCount: number;
  samplePrizeCount: number;
  windowSize: number | null;
};

export type AnalysisSnapshotNumberStatsLookup = {
  sampleDrawCount: number;
  samplePrizeCount: number;
  stats: ApiNumberStat[];
  windowSize: number;
};

const SLOW_SNAPSHOT_LOOKUP_MS = 500;
const inFlightSnapshotLoads = new Map<string, Promise<unknown>>();

export async function getAnalysisSnapshotAnalyticsReadModel(query: FilterContext) {
  const context = getAnalysisContextForFilterQuery(query);

  if (!context) {
    return null;
  }

  const contextKey = getAnalysisContextKey(context);
  const startedAt = Date.now();
  let dbQueryMs = 0;
  let parseMs = 0;
  let metadataMs = 0;
  const snapshot = await timeAsync(
    "analytics.snapshot db query",
    () => dedupeInFlight(`analytics:${contextKey}`, () => getAnalysisSnapshotAnalyticsRow(context)),
    (durationMs) => {
      dbQueryMs = durationMs;
    }
  );
  const parsed = timeSync(
    "analytics.snapshot zod parse",
    () => analyticsReadModelSchema.safeParse(snapshot?.analyticsReadModel),
    (durationMs) => {
      parseMs = durationMs;
    }
  );
  const isCurrent = timeSync(
    "analytics.snapshot metadata check",
    () =>
      Boolean(
        snapshot && parsed.success && isAnalyticsSnapshotMetadataCurrent(parsed.data, snapshot)
      ),
    (durationMs) => {
      metadataMs = durationMs;
    }
  );
  const totalMs = Date.now() - startedAt;

  warnSlowSnapshotLookup({
    analyticsReadModelBytes: snapshot?.analyticsReadModelBytes,
    contextKey,
    dbQueryMs,
    metadataMs,
    parseMs,
    totalMs
  });

  if (!snapshot || !parsed.success || !isCurrent) {
    return null;
  }

  return parsed.data satisfies ApiAnalyticsReadModel;
}

export async function getAnalysisSnapshotDigitStats(
  query: FilterContext
): Promise<ApiDigitStat[] | null> {
  const context = getAnalysisContextForFilterQuery(query);

  if (!context) {
    return null;
  }

  const snapshot = await getAnalysisSnapshotStatRunRow(context);

  if (!isStatSnapshotCurrent(snapshot)) {
    return null;
  }

  const rows = await timeAsync("analytics.digits snapshot rows query", () =>
    getAnalysisSnapshotDigitRows(snapshot.runId)
  );

  if (!rows || !isDerivedRowsCurrent(rows, snapshot)) {
    return null;
  }

  return rows.map((row) => toApiDigitStat(row, snapshot));
}

export async function getAnalysisSnapshotNumberStats(
  query: FilterContext
): Promise<ApiNumberStat[] | null> {
  const context = getAnalysisContextForFilterQuery(query);

  if (!context) {
    return null;
  }

  const snapshot = await getAnalysisSnapshotStatRunRow(context);

  if (!isStatSnapshotCurrent(snapshot)) {
    return null;
  }

  const rows = await timeAsync("analytics.numbers snapshot rows query", () =>
    getAnalysisSnapshotNumberRows(snapshot.runId)
  );

  if (!rows || !isDerivedRowsCurrent(rows, snapshot)) {
    return null;
  }

  return rows.map((row) => toApiNumberStat(row, snapshot));
}

export async function getAnalysisSnapshotNumberStatsForNumbers(
  query: FilterContext,
  numbers: readonly string[]
): Promise<AnalysisSnapshotNumberStatsLookup | null> {
  const context = getAnalysisContextForFilterQuery(query);
  const uniqueNumbers = [...new Set(numbers.map((number) => number.trim()).filter(Boolean))];

  if (!context || uniqueNumbers.length === 0) {
    return null;
  }

  const snapshot = await getAnalysisSnapshotStatRunRow(context);

  if (!isStatSnapshotCurrent(snapshot)) {
    return null;
  }

  const rows = await timeAsync("analytics.numbers snapshot filtered rows query", () =>
    getAnalysisSnapshotNumberRowsForNumbers(snapshot.runId, uniqueNumbers)
  );

  if (!rows || !areFilteredRowsCurrent(rows, snapshot)) {
    return null;
  }

  return {
    sampleDrawCount: snapshot.sampleDrawCount,
    samplePrizeCount: snapshot.samplePrizeCount,
    stats: rows.map((row) => toApiNumberStat(row, snapshot)),
    windowSize: snapshot.windowSize ?? snapshot.sampleDrawCount
  };
}

export async function getAnalysisSnapshotPatternReadModel(
  query: FilterContext
): Promise<ApiPatternsReadModel | null> {
  const context = getAnalysisContextForFilterQuery(query);

  if (!context) {
    return null;
  }

  const contextKey = getAnalysisContextKey(context);
  const startedAt = Date.now();
  let dbQueryMs = 0;
  let parseMs = 0;
  let metadataMs = 0;
  const snapshot = await timeAsync(
    "patterns.snapshot db query",
    () => dedupeInFlight(`patterns:${contextKey}`, () => getAnalysisSnapshotPatternRow(context)),
    (durationMs) => {
      dbQueryMs = durationMs;
    }
  );
  const parsed = timeSync(
    "patterns.snapshot zod parse",
    () => analysisPatternReadModelSchema.safeParse(snapshot?.patternReadModel),
    (durationMs) => {
      parseMs = durationMs;
    }
  );
  const patternReadModel = parsed.success ? parsed.data : null;
  const isCurrent = timeSync(
    "patterns.snapshot metadata check",
    () =>
      Boolean(
        snapshot && patternReadModel && isPatternSnapshotMetadataCurrent(patternReadModel, snapshot)
      ),
    (durationMs) => {
      metadataMs = durationMs;
    }
  );
  const totalMs = Date.now() - startedAt;

  warnSlowPayloadSnapshotLookup({
    contextKey,
    dbQueryMs,
    label: "patterns.snapshot lookup slow",
    metadataMs,
    parseMs,
    payloadBytes: snapshot?.patternReadModelBytes,
    payloadName: "patternReadModelBytes",
    totalMs
  });

  if (!snapshot || !patternReadModel || !isCurrent) {
    return null;
  }

  const expectedWindowSize = snapshot.windowSize ?? snapshot.sampleDrawCount;
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
    pattern: patternReadModel,
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

  const contextKey = getAnalysisContextKey(context);
  const startedAt = Date.now();
  let dbQueryMs = 0;
  let metadataMs = 0;
  const snapshot = await timeAsync(
    "calendar.snapshot db query",
    () => dedupeInFlight(`calendar:${contextKey}`, () => getAnalysisSnapshot(context)),
    (durationMs) => {
      dbQueryMs = durationMs;
    }
  );
  const model =
    snapshot && isAnalysisCalendarHeatmapReadModel(snapshot.calendarReadModel)
      ? snapshot.calendarReadModel
      : null;
  const isCurrent = timeSync(
    "calendar.snapshot metadata check",
    () => Boolean(snapshot && model && isCalendarSnapshotMetadataCurrent(model, snapshot)),
    (durationMs) => {
      metadataMs = durationMs;
    }
  );
  const totalMs = Date.now() - startedAt;

  warnSlowPayloadSnapshotLookup({
    contextKey,
    dbQueryMs,
    label: "calendar.snapshot lookup slow",
    metadataMs,
    parseMs: 0,
    payloadBytes: snapshot?.calendarReadModelBytes,
    payloadName: "calendarReadModelBytes",
    totalMs
  });

  return model && isCurrent ? model : null;
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
        pg_column_size("analyticsReadModel")::int AS "analyticsReadModelBytes",
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

async function getAnalysisSnapshotStatRunRow(
  context: AnalysisContext
): Promise<AnalysisSnapshotStatRunRow | null> {
  const contextKey = getAnalysisContextKey(context);

  return dedupeInFlight(`stats:${contextKey}`, () =>
    getAnalysisSnapshotStatRunRowUncached(context)
  );
}

async function getAnalysisSnapshotStatRunRowUncached(
  context: AnalysisContext
): Promise<AnalysisSnapshotStatRunRow | null> {
  const prisma = getPrisma();
  const contextKey = getAnalysisContextKey(context);

  try {
    const [snapshot] = await timeAsync(
      "analytics.snapshot metadata query",
      () =>
        prisma.$queryRaw<AnalysisSnapshotStatRunRow[]>`
          SELECT
            "_id"::text AS "runId",
            "sampleDrawCount",
            "samplePrizeCount",
            "windowSize"
          FROM "analysis_snapshot_runs"
          WHERE
            "contextKey" = ${contextKey}
            AND "engineVersion" = ${ANALYSIS_ENGINE_VERSION}
          LIMIT 1
        `
    );

    return snapshot ?? null;
  } catch {
    return null;
  }
}

async function getAnalysisSnapshotDigitRows(runId: string) {
  const prisma = getPrisma();

  try {
    return await prisma.$queryRaw<AnalysisSnapshotDigitRow[]>`
      SELECT
        "lotteryType"::text AS "lotteryType",
        "prizeType",
        "digit",
        "position",
        "drawCount",
        "hitCount",
        "frequencyPercent",
        "lastSeenDrawDate",
        "missingDrawCount",
        "trendDirection",
        "computedAt"
      FROM "analysis_digit_stats"
      WHERE "runId" = ${runId}::uuid
      ORDER BY "hitCount" DESC, "prizeType" ASC, COALESCE("position", 0) ASC, "digit" ASC
    `;
  } catch {
    return null;
  }
}

async function getAnalysisSnapshotNumberRows(runId: string) {
  const prisma = getPrisma();

  try {
    return await prisma.$queryRaw<AnalysisSnapshotNumberRow[]>`
      SELECT
        "lotteryType"::text AS "lotteryType",
        "prizeType",
        "number",
        "numberLength",
        "drawCount",
        "hitCount",
        "frequencyPercent",
        "lastSeenDrawDate",
        "missingDrawCount",
        "averageGap",
        "maxGap",
        "trendScore",
        "patternFlags",
        "computedAt"
      FROM "analysis_number_stats"
      WHERE "runId" = ${runId}::uuid
      ORDER BY "trendScore" DESC, "hitCount" DESC
    `;
  } catch {
    return null;
  }
}

async function getAnalysisSnapshotNumberRowsForNumbers(runId: string, numbers: readonly string[]) {
  const prisma = getPrisma();
  const numberSql = Prisma.join(numbers.map((number) => Prisma.sql`${number}`));

  try {
    return await prisma.$queryRaw<AnalysisSnapshotNumberRow[]>`
      SELECT
        "lotteryType"::text AS "lotteryType",
        "prizeType",
        "number",
        "numberLength",
        "drawCount",
        "hitCount",
        "frequencyPercent",
        "lastSeenDrawDate",
        "missingDrawCount",
        "averageGap",
        "maxGap",
        "trendScore",
        "patternFlags",
        "computedAt"
      FROM "analysis_number_stats"
      WHERE
        "runId" = ${runId}::uuid
        AND "number" IN (${numberSql})
      ORDER BY "trendScore" DESC, "hitCount" DESC
    `;
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
        pg_column_size("patternReadModel")::int AS "patternReadModelBytes",
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
        pg_column_size("calendarReadModel")::int AS "calendarReadModelBytes",
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

function isStatSnapshotCurrent(
  snapshot: AnalysisSnapshotStatRunRow | null
): snapshot is AnalysisSnapshotStatRunRow {
  return Boolean(snapshot && snapshot.windowSize === snapshot.sampleDrawCount);
}

function isDerivedRowsCurrent(
  rows: readonly { drawCount: number }[],
  snapshot: AnalysisSnapshotStatRunRow
) {
  return (
    (snapshot.samplePrizeCount === 0 || rows.length > 0) &&
    rows.every((row) => row.drawCount === snapshot.sampleDrawCount)
  );
}

function areFilteredRowsCurrent(
  rows: readonly { drawCount: number }[],
  snapshot: AnalysisSnapshotStatRunRow
) {
  return rows.every((row) => row.drawCount === snapshot.sampleDrawCount);
}

function toApiDigitStat(
  row: AnalysisSnapshotDigitRow,
  snapshot: AnalysisSnapshotStatRunRow
): ApiDigitStat {
  return {
    computedAt: normalizeDateString(row.computedAt),
    digit: row.digit,
    drawCount: row.drawCount,
    expectedFrequencyPercent: 10,
    frequencyPercent: row.frequencyPercent,
    hitCount: row.hitCount,
    lastSeenDrawDate: normalizeOptionalDateString(row.lastSeenDrawDate),
    lift: round(row.frequencyPercent / 10),
    lotteryType: row.lotteryType,
    missingDrawCount: row.missingDrawCount,
    position: row.position ?? undefined,
    prizeType: row.prizeType,
    sampleEventCount: getSampleEventCount(row.hitCount, row.frequencyPercent),
    trendDirection: row.trendDirection,
    windowSize: snapshot.windowSize ?? snapshot.sampleDrawCount
  };
}

function toApiNumberStat(
  row: AnalysisSnapshotNumberRow,
  snapshot: AnalysisSnapshotStatRunRow
): ApiNumberStat {
  return {
    averageGap: row.averageGap ?? undefined,
    computedAt: normalizeDateString(row.computedAt),
    drawCount: row.drawCount,
    frequencyPercent: row.frequencyPercent,
    frequencyPerDrawPercent: getFrequencyPercent(row.hitCount, snapshot.sampleDrawCount),
    frequencyPerPrizeRowPercent: row.frequencyPercent,
    hitCount: row.hitCount,
    lastSeenDrawDate: normalizeOptionalDateString(row.lastSeenDrawDate),
    lotteryType: row.lotteryType,
    maxGap: row.maxGap ?? undefined,
    missingDrawCount: row.missingDrawCount,
    number: row.number,
    numberLength: row.numberLength,
    patternFlags: toPatternFlags(row.patternFlags),
    prizeType: row.prizeType,
    samplePrizeCount: snapshot.samplePrizeCount,
    trendScore: row.trendScore,
    windowSize: snapshot.windowSize ?? snapshot.sampleDrawCount
  };
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

function isPatternSnapshotMetadataCurrent(
  model: ApiPatternsReadModel["pattern"],
  snapshot: AnalysisSnapshotPatternRow
) {
  return (
    snapshot.windowSize === snapshot.sampleDrawCount &&
    model.sampleSize === snapshot.samplePrizeCount
  );
}

async function dedupeInFlight<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const existing = inFlightSnapshotLoads.get(key) as Promise<T> | undefined;

  if (existing) {
    return existing;
  }

  const promise = operation().finally(() => {
    if (inFlightSnapshotLoads.get(key) === promise) {
      inFlightSnapshotLoads.delete(key);
    }
  });

  inFlightSnapshotLoads.set(key, promise);

  return promise;
}

async function timeAsync<T>(
  label: string,
  operation: () => Promise<T>,
  onDuration?: (durationMs: number) => void
) {
  const startedAt = Date.now();

  try {
    return await operation();
  } finally {
    const durationMs = Date.now() - startedAt;

    onDuration?.(durationMs);
    console.info(`[${formatDuration(durationMs)}] ${label}`);

    if (durationMs > SLOW_SNAPSHOT_LOOKUP_MS) {
      console.warn(`${label} slow (${formatDuration(durationMs)})`);
    }
  }
}

function timeSync<T>(label: string, operation: () => T, onDuration?: (durationMs: number) => void) {
  const startedAt = Date.now();

  try {
    return operation();
  } finally {
    const durationMs = Date.now() - startedAt;

    onDuration?.(durationMs);
    console.info(`[${formatDuration(durationMs)}] ${label}`);

    if (durationMs > SLOW_SNAPSHOT_LOOKUP_MS) {
      console.warn(`${label} slow (${formatDuration(durationMs)})`);
    }
  }
}

function warnSlowSnapshotLookup({
  analyticsReadModelBytes,
  contextKey,
  dbQueryMs,
  metadataMs,
  parseMs,
  totalMs
}: {
  analyticsReadModelBytes?: number | null;
  contextKey: string;
  dbQueryMs: number;
  metadataMs: number;
  parseMs: number;
  totalMs: number;
}) {
  if (totalMs <= SLOW_SNAPSHOT_LOOKUP_MS) {
    return;
  }

  console.warn(
    [
      `analytics.snapshot lookup slow (${formatDuration(totalMs)})`,
      `contextKey=${contextKey}`,
      `analyticsReadModelBytes=${analyticsReadModelBytes ?? "unknown"}`,
      `dbQuery=${formatDuration(dbQueryMs)}`,
      `zodParse=${formatDuration(parseMs)}`,
      `metadataCheck=${formatDuration(metadataMs)}`
    ].join(" ")
  );
}

function warnSlowPayloadSnapshotLookup({
  contextKey,
  dbQueryMs,
  label,
  metadataMs,
  parseMs,
  payloadBytes,
  payloadName,
  totalMs
}: {
  contextKey: string;
  dbQueryMs: number;
  label: string;
  metadataMs: number;
  parseMs: number;
  payloadBytes?: number | null;
  payloadName: string;
  totalMs: number;
}) {
  if (totalMs <= SLOW_SNAPSHOT_LOOKUP_MS) {
    return;
  }

  const parts = [
    `${label} (${formatDuration(totalMs)})`,
    `contextKey=${contextKey}`,
    `${payloadName}=${payloadBytes ?? "unknown"}`,
    `dbQuery=${formatDuration(dbQueryMs)}`
  ];

  if (parseMs > 0) {
    parts.push(`zodParse=${formatDuration(parseMs)}`);
  }

  parts.push(`metadataCheck=${formatDuration(metadataMs)}`);
  console.warn(parts.join(" "));
}

function normalizeDateString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeOptionalDateString(value: Date | string | null) {
  if (!value) {
    return undefined;
  }

  return normalizeDateString(value);
}

function toPatternFlags(value: unknown): ApiPatternFlag[] {
  return Array.isArray(value)
    ? (value.filter((item) => typeof item === "string") as ApiPatternFlag[])
    : [];
}

function getSampleEventCount(hitCount: number, frequencyPercent: number) {
  return frequencyPercent > 0 ? Math.round((hitCount / frequencyPercent) * 100) : undefined;
}

function getFrequencyPercent(hitCount: number, sampleSize: number) {
  return sampleSize > 0 ? round((hitCount / sampleSize) * 100) : 0;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDuration(durationMs: number) {
  return durationMs >= 1000 ? `${(durationMs / 1000).toFixed(2)}s` : `${durationMs.toFixed(2)}ms`;
}
