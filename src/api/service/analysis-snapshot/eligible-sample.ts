import type { AnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import { getAnalysisPrizeNumberLength } from "@/api/service/analysis-snapshot/analysis-context";
import {
  matchesAnalysisPrizeSample,
  toAnalysisPrizeTypeLabel
} from "@/api/service/analysis-snapshot/prize-sample-types";

/** In-memory draw row for audit replay — mirrors `resolveAnalysisSample` scope/prize filters. */
export type EligibleSampleDraw = {
  drawDate: Date;
  drawNo: string | null;
  prizes: Array<{
    number: string;
    position: number | null;
    type: string;
  }>;
};

export type EligibleSampleMetrics = {
  drawCount: number;
  invalidPrizeCount: number;
  prizeCount: number;
};

export function selectEligibleDraws(
  draws: readonly EligibleSampleDraw[],
  context: AnalysisContext
): EligibleSampleDraw[] {
  return draws.filter((draw) => {
    if (context.scope === "MONTH") {
      if (draw.drawDate.getUTCMonth() + 1 !== context.month) {
        return false;
      }

      if (context.year !== undefined && draw.drawDate.getUTCFullYear() !== context.year) {
        return false;
      }
    }

    return filterPrizesForContext(draw.prizes, context).length > 0;
  });
}

/** Replay sample counts from raw draws — must match `resolveAnalysisSample` for the same data. */
export function replayEligibleSampleFromDraws(
  draws: readonly EligibleSampleDraw[],
  context: AnalysisContext
): EligibleSampleMetrics {
  const eligibleDraws = selectEligibleDraws(draws, context);
  const matchedPrizes = eligibleDraws.flatMap((draw) =>
    filterValidPrizes(draw.prizes, context).map((prize) => ({
      drawDate: draw.drawDate,
      number: prize.number
    }))
  );

  return {
    drawCount: eligibleDraws.length,
    invalidPrizeCount: countInvalidLength(draws, context, eligibleDraws),
    prizeCount: matchedPrizes.length
  };
}

function filterPrizesForContext(prizes: EligibleSampleDraw["prizes"], context: AnalysisContext) {
  return prizes.filter((prize) =>
    matchesAnalysisPrizeSample(
      { position: prize.position, type: prize.type },
      { prizeType: context.prizeType }
    )
  );
}

function filterValidPrizes(prizes: EligibleSampleDraw["prizes"], context: AnalysisContext) {
  const numberLength = getAnalysisPrizeNumberLength(context.prizeType);

  return filterPrizesForContext(prizes, context)
    .filter((prize) => prize.number.length === numberLength)
    .map((prize) => ({
      ...prize,
      type: toAnalysisPrizeTypeLabel(
        { position: prize.position, type: prize.type },
        { prizeType: context.prizeType }
      )
    }));
}

function countInvalidLength(
  _draws: readonly EligibleSampleDraw[],
  context: AnalysisContext,
  sampleDraws: readonly EligibleSampleDraw[]
) {
  let invalid = 0;

  for (const draw of sampleDraws) {
    const matched = filterPrizesForContext(draw.prizes, context);
    const valid = filterValidPrizes(draw.prizes, context);

    invalid += matched.length - valid.length;
  }

  return invalid;
}
