/**
 * SQL scope/prize filters must stay aligned with in-memory replay in
 * `eligible-sample.ts` (MONTH+year, source prize types, numberLength).
 */
import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import {
  getPrizeTypesForSampleQuery,
  matchesAnalysisPrizeSample,
  toAnalysisPrizeTypeLabel
} from "@/api/service/analysis-snapshot/prize-sample-types";
import { getPrisma } from "@/api/service/prisma";
import { Prisma } from "@/generated/prisma/client";

export type AnalysisPrizeSample = {
  drawId: string;
  number: string;
  position?: number | null;
  type: string;
  draw: {
    drawDate: Date;
    lotteryType: string;
  };
};

type DrawRow = {
  drawDate: Date;
  id: string;
  lotteryType: string;
};

type PrizeRow = {
  drawDate: Date;
  drawId: string;
  lotteryType: string;
  number: string;
  position: number | null;
  type: string;
};

export type AnalysisSample = {
  drawCount: number;
  endDrawDate?: Date;
  invalidPrizeCount: number;
  prizes: AnalysisPrizeSample[];
  prizeCount: number;
  startDrawDate?: Date;
};

export async function resolveAnalysisSample(context: AnalysisContext): Promise<AnalysisSample> {
  const prisma = getPrisma();
  const drawRows = await getAnalysisDrawRows(prisma, context);

  if (drawRows.length === 0) {
    return {
      drawCount: 0,
      invalidPrizeCount: 0,
      prizes: [],
      prizeCount: 0
    };
  }

  const prizeRows = await getAnalysisPrizeRows(
    prisma,
    context,
    drawRows.map((draw) => draw.id)
  );
  const matchedRows = prizeRows.filter((row) =>
    matchesAnalysisPrizeSample({ position: row.position, type: row.type }, context)
  );
  const prizes = matchedRows.map((row) => ({
    draw: {
      drawDate: row.drawDate,
      lotteryType: row.lotteryType
    },
    drawId: row.drawId,
    number: row.number,
    position: row.position,
    type: toAnalysisPrizeTypeLabel({ position: row.position, type: row.type }, context)
  }));
  const validPrizes = prizes.filter((prize) => prize.number.length === context.numberLength);
  const drawTimes = drawRows
    .map((draw) => draw.drawDate.getTime())
    .sort((left, right) => left - right);

  return {
    drawCount: drawRows.length,
    endDrawDate: new Date(drawTimes.at(-1) ?? drawTimes[0]),
    invalidPrizeCount: prizes.length - validPrizes.length,
    prizes: validPrizes,
    prizeCount: validPrizes.length,
    startDrawDate: new Date(drawTimes[0])
  };
}

async function getAnalysisDrawRows(prisma: ReturnType<typeof getPrisma>, context: AnalysisContext) {
  const sourcePrizeTypes = getSourcePrizeTypeSql(context);
  const rows = await prisma.$queryRaw<DrawRow[]>`
    SELECT DISTINCT
      draw."_id"::text AS "id",
      draw."drawDate",
      draw."lotteryType"::text AS "lotteryType"
    FROM "lottery_draws" AS draw
    INNER JOIN "lottery_prizes" AS prize
      ON prize."drawId" = draw."_id"
    WHERE
      draw."lotteryType" = ${context.lotteryType}::"LotteryType"
      AND prize."type" IN (${sourcePrizeTypes})
      AND draw."drawDate" <= ${new Date()}
      AND (
        ${context.scope} <> 'MONTH'
        OR (
          EXTRACT(MONTH FROM draw."drawDate") = ${context.month ?? 0}
          AND EXTRACT(YEAR FROM draw."drawDate") = ${context.year ?? 0}
        )
      )
    ORDER BY draw."drawDate" DESC
  `;

  return rows.sort((left, right) => left.drawDate.getTime() - right.drawDate.getTime());
}

async function getAnalysisPrizeRows(
  prisma: ReturnType<typeof getPrisma>,
  context: AnalysisContext,
  drawIds: readonly string[]
) {
  const sourcePrizeTypes = getSourcePrizeTypeSql(context);

  return prisma.$queryRaw<PrizeRow[]>`
    SELECT
      prize."drawId"::text AS "drawId",
      prize."number",
      prize."position",
      prize."type"::text AS "type",
      draw."drawDate",
      draw."lotteryType"::text AS "lotteryType"
    FROM "lottery_prizes" AS prize
    INNER JOIN "lottery_draws" AS draw
      ON draw."_id" = prize."drawId"
    WHERE
      prize."drawId" IN (${Prisma.join(drawIds.map((id) => Prisma.sql`${id}::uuid`))})
      AND prize."type" IN (${sourcePrizeTypes})
    ORDER BY draw."drawDate" ASC, COALESCE(prize."position", 0) ASC, prize."number" ASC
  `;
}

function getSourcePrizeTypeSql(context: AnalysisContext) {
  return Prisma.join(
    getPrizeTypesForSampleQuery(context.prizeType).map(
      (prizeType) => Prisma.sql`${prizeType}::"LotteryPrizeType"`
    )
  );
}
