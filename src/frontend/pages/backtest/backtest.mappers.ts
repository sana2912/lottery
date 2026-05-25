import type {
  BacktestHistoryResponse,
  BacktestReadModel,
  BacktestRequest,
  BacktestResult
} from "@/schema/app/backtest.schema";

type BacktestExplanation = NonNullable<BacktestResult["explanation"]>;
type BacktestCandidateExplanation = BacktestExplanation["generatedCandidates"][number];

export type BacktestFormState = {
  candidateCount: string;
  lotteryType: BacktestRequest["lotteryType"];
  numberLength: string;
  prizeType: BacktestRequest["prizeType"];
  strategyId: BacktestRequest["strategyId"];
  targetDrawCount: string;
  windowSize: string;
};

export const defaultBacktestFormState: BacktestFormState = {
  candidateCount: "5",
  lotteryType: "THAI_GOVERNMENT",
  numberLength: "2",
  prizeType: "TWO_DIGIT",
  strategyId: "balanced",
  targetDrawCount: "30",
  windowSize: "10"
};

export function toBacktestPayload(formState: BacktestFormState) {
  return {
    candidateCount: formState.candidateCount,
    lotteryType: formState.lotteryType,
    numberLength: formState.numberLength,
    params: {
      targetDrawCount: formState.targetDrawCount,
      windowSize: formState.windowSize
    },
    prizeType: formState.prizeType,
    strategyId: formState.strategyId,
    targetDrawCount: formState.targetDrawCount,
    windowSize: formState.windowSize
  };
}

export function toBacktestChartPoints(backtest: BacktestReadModel) {
  return backtest.results.map((result, index) => ({
    id: result.id,
    label: `${index + 1}`,
    value: result.isHit ? 100 : Math.max(15, 30 - (result.rankOfHit ?? 0) * 5)
  }));
}

export function mergeBacktestHistory(
  history: BacktestHistoryResponse,
  backtest: BacktestReadModel
): BacktestHistoryResponse {
  return {
    ...history,
    items: [
      {
        candidateCount: backtest.run.candidateCount,
        computedAt: backtest.run.computedAt,
        coverage: backtest.run.coverage,
        hitRate: backtest.run.hitRate,
        id: backtest.run.id,
        longestMissStreak: backtest.run.longestMissStreak,
        lotteryType: backtest.run.lotteryType,
        numberLength: backtest.run.numberLength,
        prizeType: backtest.run.prizeType,
        strategyId: backtest.run.strategyId,
        strategyName: backtest.run.strategyName,
        version: backtest.run.version
      },
      ...history.items.filter((item) => item.id !== backtest.run.id)
    ].slice(0, 8)
  };
}

export function hasBacktestRowExplanation(result: BacktestResult) {
  return Boolean(result.explanation);
}

export function getBacktestExplanationSummary(backtest: BacktestReadModel, result: BacktestResult) {
  const explanation = result.explanation;

  if (!explanation) {
    return null;
  }

  const winningCandidate = explanation.generatedCandidates.find((candidate) => candidate.isHit);
  const strongestSignal = winningCandidate
    ? getStrongestSignalLabel(winningCandidate.scoreBreakdown)
    : getStrongestSignalLabel(explanation.generatedCandidates[0]?.scoreBreakdown);

  return {
    calculationWindow: explanation.calculationWindow,
    candidateCount: explanation.candidateCount,
    drawDateLabel: new Date(result.drawDate).toLocaleDateString("th-TH"),
    generatedCount: result.generatedNumbers.length,
    hitNumber: result.hitNumbers[0],
    prizeType: backtest.run.prizeType,
    strategyLabel: explanation.strategyName,
    strongestSignal,
    version: explanation.version,
    winningCandidate
  };
}

export function getBacktestCalculationLines(result: BacktestResult) {
  const explanation = result.explanation;

  if (!explanation) {
    return [];
  }

  return [
    `งวดนี้ engine ใช้ย้อนหลังเฉพาะ ${explanation.calculationWindow} งวดก่อนหน้า ไม่ได้เห็นผลของงวดเป้าหมายล่วงหน้า`,
    "ระบบแยกดูทีละตำแหน่งของเลข แล้วให้คะแนนจากความถี่ล่าสุด ความห่างการออก และทิศทางของแต่ละ digit",
    `หลังจากนั้น strategy ${explanation.strategyName} จะรวมสัญญาณ hot, overdue, shape และ trend ให้เป็นคะแนนสุดท้าย`,
    `สุดท้ายระบบสร้าง ${explanation.generatedCandidates.length} เลข แล้วค่อยนำไปเทียบกับผลจริงของงวดนี้`
  ];
}

export function getBacktestHumanReasonLines(result: BacktestResult) {
  const explanation = result.explanation;

  if (!explanation) {
    return [];
  }

  const winningCandidate = explanation.generatedCandidates.find((candidate) => candidate.isHit);

  if (!winningCandidate) {
    return [];
  }

  const strongestSignal = getStrongestSignalLabel(winningCandidate.scoreBreakdown);

  return [
    `เลขที่ hit คือ ${winningCandidate.number} ซึ่งอยู่ลำดับที่ ${winningCandidate.rank} ของชุดเลขที่ระบบ generate`,
    `สัญญาณเด่นที่สุดของเลขนี้คือ ${strongestSignal} และได้คะแนนรวม ${winningCandidate.score}`,
    ...winningCandidate.reasons.slice(0, 3)
  ];
}

function getStrongestSignalLabel(
  scoreBreakdown: BacktestCandidateExplanation["scoreBreakdown"] | undefined
) {
  if (!scoreBreakdown) {
    return "ภาพรวมของคะแนนทั้งหมด";
  }

  const [signal] =
    Object.entries(scoreBreakdown).sort((left, right) => Number(right[1]) - Number(left[1]))[0] ??
    [];

  const labels: Record<string, string> = {
    hot: "digit ที่ออกบ่อยในตำแหน่งนี้",
    overdue: "digit ที่หายไปนาน",
    pair: "รูปทรงเลขที่ดูเป็นธรรมชาติ",
    pattern: "pattern ของเลข",
    position: "trend ของตำแหน่ง"
  };

  return labels[signal ?? ""] ?? "ภาพรวมของคะแนนทั้งหมด";
}
