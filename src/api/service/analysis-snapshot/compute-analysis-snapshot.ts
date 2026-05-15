import { randomBytes } from "node:crypto";
import {
  type AnalysisContext,
  getAnalysisContextKey,
  getAnalysisWindowLimit
} from "@/api/service/analysis-snapshot/analysis-context";
import { buildAnalysisCalendarHeatmapReadModel } from "@/api/service/analysis-snapshot/calendar-heatmap-read-model";
import { buildAnalysisPatternReadModel } from "@/api/service/analysis-snapshot/pattern-read-model";
import { resolveAnalysisSample } from "@/api/service/analysis-snapshot/sample-resolver";
import { buildAnalyticsReadModelFromPrizes } from "@/api/service/analytics/analytics-engine";
import { getPrisma } from "@/api/service/prisma";
import { Prisma } from "@/generated/prisma/client";

export type AnalysisSnapshotSummary = {
  computedAt: string;
  contextKey: string;
  invalidPrizeCount: number;
  prizeType: AnalysisContext["prizeType"];
  sampleDrawCount: number;
  samplePrizeCount: number;
  scope: AnalysisContext["scope"];
  windowPreset: AnalysisContext["windowPreset"];
};

const SNAPSHOT_INSERT_CHUNK_SIZE = 500;
const SNAPSHOT_TRANSACTION_TIMEOUT_MS = 60_000;

export async function recomputeAnalysisSnapshot(
  context: AnalysisContext
): Promise<AnalysisSnapshotSummary> {
  const prisma = getPrisma();
  const computedAt = new Date();
  const contextKey = getAnalysisContextKey(context);
  const sample = await resolveAnalysisSample(context);
  const windowSize = getAnalysisWindowLimit(context.windowPreset) ?? sample.drawCount;
  const analyticsReadModel = buildAnalyticsReadModelFromPrizes(
    sample.prizes,
    {
      lotteryType: context.lotteryType,
      numberLength: context.numberLength,
      page: 1,
      pageSize: 100,
      prizeType: context.prizeType,
      windowSize
    },
    computedAt
  );
  const patternReadModel = buildAnalysisPatternReadModel(analyticsReadModel);
  const calendarReadModel = buildAnalysisCalendarHeatmapReadModel(context, sample.prizes);
  const runId = createUuidV7();

  await prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRaw`
        DELETE FROM "analysis_snapshot_runs"
        WHERE "contextKey" = ${contextKey}
      `;
      await transaction.$executeRaw`
        INSERT INTO "analysis_snapshot_runs" (
          "_id",
          "contextKey",
          "lotteryType",
          "prizeType",
          "numberLength",
          "scope",
          "month",
          "windowPreset",
          "windowSize",
          "sampleDrawCount",
          "samplePrizeCount",
          "invalidPrizeCount",
          "startDrawDate",
          "endDrawDate",
          "analyticsReadModel",
          "patternReadModel",
          "calendarReadModel",
          "engineVersion",
          "computedAt",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${runId}::uuid,
          ${contextKey},
          ${context.lotteryType}::"LotteryType",
          ${context.prizeType}::"LotteryPrizeType",
          ${context.numberLength},
          ${context.scope},
          ${context.month ?? null},
          ${context.windowPreset},
          ${getAnalysisWindowLimit(context.windowPreset) ?? null},
          ${sample.drawCount},
          ${sample.prizeCount},
          ${sample.invalidPrizeCount},
          ${sample.startDrawDate ?? null},
          ${sample.endDrawDate ?? null},
          ${toJson(analyticsReadModel)}::jsonb,
          ${toJson(patternReadModel)}::jsonb,
          ${toJson(calendarReadModel)}::jsonb,
          ${context.engineVersion},
          ${computedAt},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `;

      for (const digitStats of chunk(analyticsReadModel.digitStats, SNAPSHOT_INSERT_CHUNK_SIZE)) {
        await transaction.$executeRaw`
          INSERT INTO "analysis_digit_stats" (
            "_id",
            "runId",
            "lotteryType",
            "prizeType",
            "windowPreset",
            "digit",
            "position",
            "drawCount",
            "hitCount",
            "frequencyPercent",
            "lastSeenDrawDate",
            "missingDrawCount",
            "trendDirection",
            "computedAt",
            "createdAt",
            "updatedAt"
          )
          VALUES ${Prisma.join(
            digitStats.map(
              (stat) => Prisma.sql`(
                ${createUuidV7()}::uuid,
                ${runId}::uuid,
                ${stat.lotteryType}::"LotteryType",
                ${stat.prizeType}::"LotteryPrizeType",
                ${context.windowPreset},
                ${stat.digit},
                ${stat.position ?? null},
                ${stat.drawCount},
                ${stat.hitCount},
                ${stat.frequencyPercent},
                ${stat.lastSeenDrawDate ? new Date(stat.lastSeenDrawDate) : null},
                ${stat.missingDrawCount},
                ${stat.trendDirection},
                ${computedAt},
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              )`
            )
          )}
        `;
      }

      for (const numberStats of chunk(analyticsReadModel.numberStats, SNAPSHOT_INSERT_CHUNK_SIZE)) {
        await transaction.$executeRaw`
          INSERT INTO "analysis_number_stats" (
            "_id",
            "runId",
            "lotteryType",
            "prizeType",
            "windowPreset",
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
            "computedAt",
            "createdAt",
            "updatedAt"
          )
          VALUES ${Prisma.join(
            numberStats.map(
              (stat) => Prisma.sql`(
                ${createUuidV7()}::uuid,
                ${runId}::uuid,
                ${stat.lotteryType}::"LotteryType",
                ${stat.prizeType}::"LotteryPrizeType",
                ${context.windowPreset},
                ${stat.number},
                ${stat.numberLength},
                ${stat.drawCount},
                ${stat.hitCount},
                ${stat.frequencyPercent},
                ${stat.lastSeenDrawDate ? new Date(stat.lastSeenDrawDate) : null},
                ${stat.missingDrawCount},
                ${stat.averageGap ?? null},
                ${stat.maxGap ?? null},
                ${stat.trendScore},
                ${toJson(stat.patternFlags)}::jsonb,
                ${computedAt},
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              )`
            )
          )}
        `;
      }

      if (analyticsReadModel.patternSummaries.length > 0) {
        await transaction.$executeRaw`
          INSERT INTO "analysis_pattern_summaries" (
            "_id",
            "runId",
            "lotteryType",
            "prizeType",
            "windowPreset",
            "pattern",
            "hitCount",
            "frequencyPercent",
            "sampleSize",
            "examples",
            "computedAt",
            "createdAt",
            "updatedAt"
          )
          VALUES ${Prisma.join(
            analyticsReadModel.patternSummaries.map(
              (summary) => Prisma.sql`(
                ${createUuidV7()}::uuid,
                ${runId}::uuid,
                ${context.lotteryType}::"LotteryType",
                ${context.prizeType}::"LotteryPrizeType",
                ${context.windowPreset},
                ${summary.pattern},
                ${summary.hitCount},
                ${summary.frequencyPercent},
                ${summary.sampleSize},
                ${patternReadModel.overview.find((item) => item.id === summary.id)?.examples ?? []},
                ${computedAt},
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              )`
            )
          )}
        `;
      }

      const heatmapCells = calendarReadModel.heatmapRows.flatMap((row) =>
        row.cells.map((cell) => ({
          ...cell,
          position: row.position
        }))
      );

      if (heatmapCells.length > 0) {
        await transaction.$executeRaw`
          INSERT INTO "analysis_calendar_heatmaps" (
            "_id",
            "runId",
            "lotteryType",
            "prizeType",
            "scope",
            "month",
            "windowPreset",
            "position",
            "digit",
            "appearanceCount",
            "missingRounds",
            "score",
            "tone",
            "computedAt",
            "createdAt",
            "updatedAt"
          )
          VALUES ${Prisma.join(
            heatmapCells.map(
              (cell) => Prisma.sql`(
                ${createUuidV7()}::uuid,
                ${runId}::uuid,
                ${context.lotteryType}::"LotteryType",
                ${context.prizeType}::"LotteryPrizeType",
                ${context.scope},
                ${context.month ?? null},
                ${context.windowPreset},
                ${cell.position},
                ${cell.digit},
                ${cell.appearanceCount},
                ${cell.missingRounds},
                ${cell.score},
                ${cell.tone},
                ${computedAt},
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              )`
            )
          )}
        `;
      }
    },
    {
      timeout: SNAPSHOT_TRANSACTION_TIMEOUT_MS
    }
  );

  return {
    computedAt: computedAt.toISOString(),
    contextKey,
    invalidPrizeCount: sample.invalidPrizeCount,
    prizeType: context.prizeType,
    sampleDrawCount: sample.drawCount,
    samplePrizeCount: sample.prizeCount,
    scope: context.scope,
    windowPreset: context.windowPreset
  };
}

function toJson(value: unknown) {
  return JSON.stringify(value);
}

function chunk<T>(items: readonly T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function createUuidV7() {
  const bytes = randomBytes(16);
  const timestamp = Date.now();

  bytes[0] = Math.floor(timestamp / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(timestamp / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(timestamp / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(timestamp / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(timestamp / 2 ** 8) & 0xff;
  bytes[5] = timestamp & 0xff;
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return [
    bytes.subarray(0, 4).toString("hex"),
    bytes.subarray(4, 6).toString("hex"),
    bytes.subarray(6, 8).toString("hex"),
    bytes.subarray(8, 10).toString("hex"),
    bytes.subarray(10, 16).toString("hex")
  ].join("-");
}
