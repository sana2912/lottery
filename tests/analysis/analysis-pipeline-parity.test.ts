import { afterEach, describe, expect, test } from "bun:test";
import { createAnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import { buildAnalysisCalendarHeatmapReadModel } from "@/api/service/analysis-snapshot/calendar-heatmap-read-model";
import {
  type EligibleSampleDraw,
  replayEligibleSampleFromDraws
} from "@/api/service/analysis-snapshot/eligible-sample";
import { buildOnDemandAnalysisReadModel } from "@/api/service/analysis-snapshot/on-demand-read-model";
import { buildAnalysisPatternReadModel } from "@/api/service/analysis-snapshot/pattern-read-model";
import { resolveAnalysisSample } from "@/api/service/analysis-snapshot/sample-resolver";
import { buildAnalyticsReadModelFromPrizes } from "@/api/service/analytics/analytics-engine";
import { buildCalendarHeatmapInsight } from "@/api/service/calendar/calendar-heatmap-insight";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("analysis pipeline parity", () => {
  test("in-memory eligible replay matches resolveAnalysisSample counts", async () => {
    const context = createAnalysisContext({
      month: 4,
      prizeType: "TWO_DIGIT",
      scope: "MONTH"
    });
    const draws = toEligibleDraws(drawRows(), prizeRows());

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);

        if (sql.includes("SELECT DISTINCT")) {
          return drawRows();
        }

        return prizeRows();
      }
    };

    const [sqlSample, replay] = await Promise.all([
      resolveAnalysisSample(context),
      Promise.resolve(replayEligibleSampleFromDraws(draws, context))
    ]);

    expect(replay.drawCount).toBe(sqlSample.drawCount);
    expect(replay.prizeCount).toBe(sqlSample.prizeCount);
    expect(replay.invalidPrizeCount).toBe(sqlSample.invalidPrizeCount);
  });

  test("on-demand analytics matches compute-path builder from the same sample", async () => {
    const context = createAnalysisContext({
      month: 4,
      prizeType: "TWO_DIGIT",
      scope: "MONTH"
    });
    const computedAt = new Date("2026-04-29T00:00:00.000Z");

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);

        if (sql.includes("SELECT DISTINCT")) {
          return drawRows();
        }

        return prizeRows();
      }
    };

    const sample = await resolveAnalysisSample(context);
    const computePath = buildAnalyticsReadModelFromPrizes(sample.prizes, context, computedAt, {
      drawCount: sample.drawCount,
      prizeCount: sample.prizeCount
    });
    const onDemand = await buildOnDemandAnalysisReadModel(context, computedAt);

    expect(onDemand.summary.drawCount).toBe(computePath.summary.drawCount);
    expect(onDemand.summary.drawCount).toBe(sample.drawCount);
    expect(onDemand.summary.prizeCount).toBe(sample.prizeCount);
    expect(onDemand.numberStats.every((stat) => stat.drawCount === sample.drawCount)).toBe(true);
    expect(onDemand.digitStats).toHaveLength(computePath.digitStats.length);
    expect(onDemand.numberStats.map((stat) => stat.number).sort()).toEqual(
      computePath.numberStats.map((stat) => stat.number).sort()
    );
    expect(onDemand.patternSummaries.map((item) => item.pattern).sort()).toEqual(
      computePath.patternSummaries.map((item) => item.pattern).sort()
    );
  });

  test("calendar heatmap read model matches calendar insight for the same sample", async () => {
    const context = createAnalysisContext({
      month: 4,
      prizeType: "TWO_DIGIT",
      scope: "MONTH"
    });

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);

        if (sql.includes("SELECT DISTINCT")) {
          return drawRows();
        }

        return prizeRows();
      }
    };

    const sample = await resolveAnalysisSample(context);
    const snapshotCalendar = buildAnalysisCalendarHeatmapReadModel(context, sample.prizes, {
      drawCount: sample.drawCount,
      invalidPrizeCount: sample.invalidPrizeCount,
      prizeCount: sample.prizeCount
    });
    const insight = buildCalendarHeatmapInsight(context, sample);

    expect(insight).not.toBeNull();
    expect(insight?.drawCount).toBe(snapshotCalendar.drawCount);
    expect(insight?.opportunityCountPerPosition).toBe(snapshotCalendar.opportunityCountPerPosition);

    const snapshotCell = snapshotCalendar.heatmapRows[0]?.cells[0];
    const insightCell = insight?.heatmapRows[0]?.cells[0];

    expect(insightCell?.hitCount).toBe(snapshotCell?.eventCount);
    expect(insightCell?.opportunityCount).toBe(snapshotCell?.sampleEventCount);
  });

  test("pattern read model matches on-demand analytics payload", async () => {
    const context = createAnalysisContext({
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME"
    });
    const computedAt = new Date("2026-04-29T00:00:00.000Z");

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);

        if (sql.includes("SELECT DISTINCT")) {
          return drawRows();
        }

        return prizeRows();
      }
    };

    const onDemand = await buildOnDemandAnalysisReadModel(context, computedAt);
    const sample = await resolveAnalysisSample(context);
    const fromOnDemand = buildAnalysisPatternReadModel(onDemand);
    const fromCompute = buildAnalysisPatternReadModel(
      buildAnalyticsReadModelFromPrizes(sample.prizes, context, computedAt, {
        drawCount: sample.drawCount,
        prizeCount: sample.prizeCount
      })
    );

    expect(fromOnDemand.sampleSize).toBe(fromCompute.sampleSize);
    expect(fromOnDemand.overview.map((item) => item.pattern).sort()).toEqual(
      fromCompute.overview.map((item) => item.pattern).sort()
    );
    expect(fromOnDemand.examples[0]?.number).toBe(fromCompute.examples[0]?.number);
  });
});

function toEligibleDraws(
  draws: ReturnType<typeof drawRows>,
  prizes: ReturnType<typeof prizeRows>
): EligibleSampleDraw[] {
  return draws.map((draw) => ({
    drawDate: draw.drawDate,
    drawNo: draw.id,
    prizes: prizes
      .filter((prize) => prize.drawId === draw.id)
      .map((prize) => ({
        number: prize.number,
        position: prize.position,
        type: prize.type
      }))
  }));
}

function drawRows() {
  return [
    {
      drawDate: new Date("2024-04-01T00:00:00.000Z"),
      id: "00000000-0000-7000-8000-000000000003",
      lotteryType: "THAI_GOVERNMENT"
    },
    {
      drawDate: new Date("2026-04-01T00:00:00.000Z"),
      id: "00000000-0000-7000-8000-000000000001",
      lotteryType: "THAI_GOVERNMENT"
    },
    {
      drawDate: new Date("2026-04-16T00:00:00.000Z"),
      id: "00000000-0000-7000-8000-000000000002",
      lotteryType: "THAI_GOVERNMENT"
    },
    {
      drawDate: new Date("2026-04-30T00:00:00.000Z"),
      id: "00000000-0000-7000-8000-000000000004",
      lotteryType: "THAI_GOVERNMENT"
    }
  ];
}

function prizeRows() {
  return [
    prizeRow("00000000-0000-7000-8000-000000000003", "2024-04-01T00:00:00.000Z", "88", 1),
    prizeRow("00000000-0000-7000-8000-000000000001", "2026-04-01T00:00:00.000Z", "09", 1),
    prizeRow("00000000-0000-7000-8000-000000000001", "2026-04-01T00:00:00.000Z", "123", 2),
    prizeRow("00000000-0000-7000-8000-000000000002", "2026-04-16T00:00:00.000Z", "11", 1),
    prizeRow("00000000-0000-7000-8000-000000000002", "2026-04-16T00:00:00.000Z", "22", 2),
    prizeRow("00000000-0000-7000-8000-000000000004", "2026-04-30T00:00:00.000Z", "123", 1)
  ];
}

function prizeRow(drawId: string, drawDate: string, number: string, position: number) {
  return {
    drawDate: new Date(drawDate),
    drawId,
    lotteryType: "THAI_GOVERNMENT",
    number,
    position,
    type: "TWO_DIGIT"
  };
}

function getSqlText(template: unknown) {
  return Array.isArray(template) ? template.join("?") : String(template);
}
