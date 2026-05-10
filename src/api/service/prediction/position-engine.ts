import type { PredictionStrategy } from "@/api/service/prediction/strategy-registry";
import {
  getShapeNaturalnessScore,
  getShapePatternScore,
  getShapeReasons
} from "@/lib/app/number-shape";
import type { ApiDigitStat } from "@/schema/api/analytics";
import type {
  ApiPredictionPositionBreakdown,
  ApiPredictionResult,
  ApiPredictionScoreBreakdown
} from "@/schema/api/prediction";

type PositionCandidateInput = {
  count: number;
  digitStats: readonly ApiDigitStat[];
  inputWindow: number;
  numberLength: number;
  strategy: PredictionStrategy;
};

type DigitOption = {
  breakdown: ApiPredictionPositionBreakdown;
  digit: string;
  score: number;
};

type GeneratedPredictionResult = Omit<ApiPredictionResult, "id" | "rank">;

export function buildPositionPredictionResults({
  count,
  digitStats,
  inputWindow,
  numberLength,
  strategy
}: PositionCandidateInput): GeneratedPredictionResult[] {
  if (digitStats.length === 0) {
    return [];
  }

  const resolvedLength = Math.max(1, numberLength, ...digitStats.map((stat) => stat.position ?? 0));
  const optionsByPosition = Array.from({ length: resolvedLength }, (_, index) =>
    buildDigitOptionsForPosition(index + 1, digitStats, strategy)
  );
  const candidates = enumerateCandidates(optionsByPosition, strategy, inputWindow);

  return selectDiverseCandidates(
    [...candidates.values()].sort(
      (left, right) => right.score - left.score || left.number.localeCompare(right.number)
    ),
    count
  );
}

function selectDiverseCandidates(
  sortedCandidates: readonly GeneratedPredictionResult[],
  count: number
) {
  const selected: GeneratedPredictionResult[] = [];
  const numberLength = sortedCandidates[0]?.number.length ?? 0;
  const maxRepeatedDigitNumbers = getMaxAllSameCandidates(count, numberLength);
  const digitUseByPosition = new Map<string, number>();
  let repeatedDigitNumbers = 0;

  for (const candidate of sortedCandidates) {
    if (selected.length >= count) {
      break;
    }

    if (
      hasSingleRepeatedDigit(candidate.number) &&
      repeatedDigitNumbers >= maxRepeatedDigitNumbers
    ) {
      continue;
    }

    if (overusesSameDigitPosition(candidate.number, digitUseByPosition, count)) {
      continue;
    }

    selected.push(candidate);

    if (hasSingleRepeatedDigit(candidate.number)) {
      repeatedDigitNumbers += 1;
    }

    for (const [index, digit] of [...candidate.number].entries()) {
      const key = `${index + 1}:${digit}`;
      digitUseByPosition.set(key, (digitUseByPosition.get(key) ?? 0) + 1);
    }
  }

  if (selected.length >= count) {
    return selected;
  }

  const selectedNumbers = new Set(selected.map((candidate) => candidate.number));

  return [
    ...selected,
    ...sortedCandidates.filter((candidate) => !selectedNumbers.has(candidate.number))
  ].slice(0, count);
}

function overusesSameDigitPosition(
  number: string,
  digitUseByPosition: ReadonlyMap<string, number>,
  count: number
) {
  const maxUsePerPositionDigit = Math.max(2, Math.ceil(count * 0.45));

  return [...number].some((digit, index) => {
    const key = `${index + 1}:${digit}`;

    return (digitUseByPosition.get(key) ?? 0) >= maxUsePerPositionDigit;
  });
}

function hasSingleRepeatedDigit(number: string) {
  return new Set([...number]).size === 1;
}

function getMaxAllSameCandidates(count: number, numberLength: number) {
  if (numberLength <= 2) {
    return Math.max(1, Math.floor(count * 0.2));
  }

  if (numberLength === 3) {
    return Math.max(1, Math.floor(count * 0.1));
  }

  return 0;
}

function buildDigitOptionsForPosition(
  positionIndex: number,
  digitStats: readonly ApiDigitStat[],
  strategy: PredictionStrategy
): DigitOption[] {
  const positionStats = new Map(
    digitStats
      .filter((stat) => stat.position === positionIndex)
      .map((stat) => [stat.digit, stat] as const)
  );
  const drawCount = digitStats[0]?.drawCount ?? 0;

  return Array.from({ length: 10 }, (_, digitIndex) => {
    const digit = String(digitIndex);
    const stat =
      positionStats.get(digit) ??
      ({
        computedAt: new Date().toISOString(),
        digit,
        drawCount,
        frequencyPercent: 0,
        hitCount: 0,
        lastSeenDrawDate: undefined,
        lotteryType: digitStats[0]?.lotteryType ?? "THAI_GOVERNMENT",
        missingDrawCount: drawCount,
        position: positionIndex,
        prizeType: digitStats[0]?.prizeType ?? "TWO_DIGIT",
        trendDirection: "flat",
        windowSize: digitStats[0]?.windowSize ?? 0
      } satisfies ApiDigitStat);
    const breakdown = toPositionBreakdown(stat, positionIndex);
    const score = round(
      breakdown.hot * strategy.weights.hot +
        breakdown.overdue * strategy.weights.overdue +
        breakdown.position * strategy.weights.position
    );

    return {
      breakdown: {
        ...breakdown,
        score
      },
      digit,
      score
    };
  }).sort(
    (left, right) =>
      right.score - left.score ||
      right.breakdown.hot - left.breakdown.hot ||
      right.breakdown.overdue - left.breakdown.overdue ||
      left.digit.localeCompare(right.digit)
  );
}

function enumerateCandidates(
  optionsByPosition: readonly DigitOption[][],
  strategy: PredictionStrategy,
  inputWindow: number
) {
  const candidates = new Map<string, GeneratedPredictionResult>();

  function walk(positionIndex: number, currentDigits: string[], currentBreakdowns: DigitOption[]) {
    if (positionIndex >= optionsByPosition.length) {
      const number = currentDigits.join("");
      const positionBreakdown = currentBreakdowns.map(({ breakdown }) => breakdown);
      const scoreBreakdown = toCandidateScoreBreakdown(positionBreakdown, number);
      const score = round(
        scoreBreakdown.hot * strategy.weights.hot +
          scoreBreakdown.overdue * strategy.weights.overdue +
          scoreBreakdown.pair * strategy.weights.pair +
          scoreBreakdown.pattern * strategy.weights.pattern +
          scoreBreakdown.position * strategy.weights.position
      );
      const candidate = {
        inputWindow,
        number,
        numberLength: number.length,
        positionBreakdown,
        reasons: toCandidateReasons(positionBreakdown, scoreBreakdown),
        score,
        scoreBreakdown,
        strategyId: strategy.id,
        strategyName: strategy.name,
        version: "prediction-engine-v1"
      } satisfies GeneratedPredictionResult;

      const existing = candidates.get(number);

      if (!existing || existing.score < candidate.score) {
        candidates.set(number, candidate);
      }

      return;
    }

    const choices = optionsByPosition[positionIndex].slice(
      0,
      getChoicesPerPosition(optionsByPosition.length)
    );

    for (const choice of choices) {
      currentDigits.push(choice.digit);
      currentBreakdowns.push(choice);
      walk(positionIndex + 1, currentDigits, currentBreakdowns);
      currentDigits.pop();
      currentBreakdowns.pop();
    }
  }

  walk(0, [], []);

  return candidates;
}

function getChoicesPerPosition(numberLength: number) {
  if (numberLength <= 2) {
    return 10;
  }

  if (numberLength === 3) {
    return 8;
  }

  return 4;
}

function toPositionBreakdown(
  stat: ApiDigitStat,
  positionIndex: number
): ApiPredictionPositionBreakdown {
  const hot = getHotScore(stat.frequencyPercent);
  const overdue = clamp(stat.missingDrawCount * 8);
  const position = trendDirectionScore(stat.trendDirection);

  return {
    digit: stat.digit,
    hot,
    overdue,
    position,
    positionIndex,
    reasons: buildPositionReasons(stat),
    score: 0,
    tone: toTone(hot, overdue, position)
  };
}

function toCandidateScoreBreakdown(
  positionBreakdown: readonly ApiPredictionPositionBreakdown[],
  number: string
): ApiPredictionScoreBreakdown {
  const divisor = Math.max(1, positionBreakdown.length);

  return {
    hot: round(positionBreakdown.reduce((total, breakdown) => total + breakdown.hot, 0) / divisor),
    overdue: round(
      positionBreakdown.reduce((total, breakdown) => total + breakdown.overdue, 0) / divisor
    ),
    pair: getShapeNaturalnessScore(number),
    pattern: getShapePatternScore(number),
    position: round(
      positionBreakdown.reduce((total, breakdown) => total + breakdown.position, 0) / divisor
    )
  };
}

function toCandidateReasons(
  positionBreakdown: readonly ApiPredictionPositionBreakdown[],
  scoreBreakdown: ApiPredictionScoreBreakdown
) {
  const reasons = [
    `Built from independent position rankings across ${positionBreakdown.length} positions.`
  ];

  for (const breakdown of positionBreakdown.slice(0, 2)) {
    reasons.push(
      `Position ${breakdown.positionIndex} selected digit ${breakdown.digit} with hot ${breakdown.hot}, overdue ${breakdown.overdue}, and trend ${breakdown.position}.`
    );
  }

  reasons.push(
    `Shape naturalness score is ${scoreBreakdown.pair} and pattern score is ${scoreBreakdown.pattern}.`
  );
  reasons.push(...getShapeReasons(positionBreakdown.map((breakdown) => breakdown.digit).join("")));

  return reasons;
}

function buildPositionReasons(stat: ApiDigitStat) {
  const reasons = [
    `Position frequency is ${stat.frequencyPercent}% against a 10% digit baseline.`,
    `Missing draw count is ${stat.missingDrawCount}.`,
    `Trend direction is ${stat.trendDirection}.`
  ];

  if (stat.lastSeenDrawDate) {
    reasons.push(`Last seen at ${stat.lastSeenDrawDate}.`);
  }

  return reasons;
}

function trendDirectionScore(trendDirection: ApiDigitStat["trendDirection"]) {
  switch (trendDirection) {
    case "up":
      return 65;
    case "down":
      return 35;
    default:
      return 50;
  }
}

function getHotScore(frequencyPercent: number) {
  return clamp(50 + (frequencyPercent - 10) * 6);
}

function toTone(
  hot: number,
  overdue: number,
  position: number
): "cold" | "hot" | "neutral" | "warm" {
  const score = (hot + overdue + position) / 3;

  if (score >= 70) {
    return "hot";
  }

  if (score >= 50) {
    return "warm";
  }

  if (score >= 30) {
    return "neutral";
  }

  return "cold";
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, round(value)));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
