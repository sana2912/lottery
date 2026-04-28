export type PrizeLike = {
  draw: {
    drawDate: Date | string;
    lotteryType: string;
  };
  number: string;
  type: string;
};

export type DigitEvent = {
  digit: string;
  drawDate: Date;
  lotteryType: string;
  number: string;
  position: number;
  prizeType: string;
};

export function extractDigitEvents(prizes: readonly PrizeLike[]): DigitEvent[] {
  return prizes.flatMap((prize) => {
    const digits = [...prize.number];

    return digits.map((digit, index) => ({
      digit,
      drawDate: normalizeDate(prize.draw.drawDate),
      lotteryType: prize.draw.lotteryType,
      number: prize.number,
      position: index + 1,
      prizeType: prize.type
    }));
  });
}

function normalizeDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
