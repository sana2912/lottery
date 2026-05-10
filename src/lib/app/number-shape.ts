export type NumberShapeFlag =
  | "odd"
  | "even"
  | "high"
  | "low"
  | "double"
  | "has_repeat"
  | "all_unique"
  | "double_pair"
  | "triple"
  | "quad_or_more"
  | "ascending"
  | "descending"
  | "ascending_run"
  | "descending_run"
  | "mirror"
  | "palindrome"
  | "balanced_odd_even"
  | "balanced_high_low"
  | "low_sum"
  | "mid_sum"
  | "high_sum";

export type DigitSumTone = "high" | "low" | "mid";

export type NumberShapeAnalysis = {
  digitSum: number;
  digitSumTone: DigitSumTone;
  flags: NumberShapeFlag[];
  maxRepeat: number;
  number: string;
  numberLength: number;
  uniqueCount: number;
};

export function analyzeNumberShape(number: string): NumberShapeAnalysis {
  const digits = [...number].map(Number);
  const uniqueCount = new Set(digits).size;
  const maxRepeat = getMaxRepeatCount(digits);
  const digitSum = getDigitSum(number);
  const digitSumTone = getDigitSumTone(number);
  const flags: NumberShapeFlag[] = [];
  const lastDigit = digits.at(-1);

  if (lastDigit !== undefined) {
    flags.push(lastDigit % 2 === 0 ? "even" : "odd", lastDigit >= 5 ? "high" : "low");
  }

  if (number.length > 1 && uniqueCount === 1) {
    flags.push("double", "has_repeat", "mirror");
  } else if (uniqueCount < number.length) {
    flags.push("has_repeat");
  }

  if (uniqueCount === number.length) {
    flags.push("all_unique");
  }

  if (getRepeatGroupCount(digits, 2) >= 2) {
    flags.push("double_pair");
  }

  if (maxRepeat >= 3) {
    flags.push("triple");
  }

  if (maxRepeat >= 4) {
    flags.push("quad_or_more");
  }

  if (isFullyAscending(digits)) {
    flags.push("ascending");
  }

  if (isFullyDescending(digits)) {
    flags.push("descending");
  }

  if (hasAscendingRun(digits)) {
    flags.push("ascending_run");
  }

  if (hasDescendingRun(digits)) {
    flags.push("descending_run");
  }

  if (isPalindrome(number)) {
    flags.push("palindrome", "mirror");
  }

  if (hasBalancedOddEven(digits)) {
    flags.push("balanced_odd_even");
  }

  if (hasBalancedHighLow(digits)) {
    flags.push("balanced_high_low");
  }

  flags.push(`${digitSumTone}_sum`);

  return {
    digitSum,
    digitSumTone,
    flags: [...new Set(flags)],
    maxRepeat,
    number,
    numberLength: number.length,
    uniqueCount
  };
}

export function getNumberShapeFlags(number: string) {
  return analyzeNumberShape(number).flags;
}

export function hasNumberShapeFlag(number: string, flag: NumberShapeFlag) {
  return getNumberShapeFlags(number).includes(flag);
}

export function getShapeNaturalnessScore(number: string) {
  const shape = analyzeNumberShape(number);
  let score = getUniqueCountScore(shape.numberLength, shape.uniqueCount);

  if (shape.maxRepeat >= 4) {
    score -= shape.numberLength >= 6 ? 25 : 35;
  } else if (shape.maxRepeat === 3) {
    score -= shape.numberLength >= 6 ? 4 : 18;
  }

  if (shape.digitSumTone === "mid") {
    score += 8;
  } else {
    score -= shape.numberLength >= 6 ? 10 : 4;
  }

  return clamp(score);
}

export function getShapePatternScore(number: string) {
  const shape = analyzeNumberShape(number);
  let score = 40;

  if (shape.flags.includes("ascending_run") || shape.flags.includes("descending_run")) {
    score += 12;
  }

  if (shape.flags.includes("palindrome")) {
    score += shape.numberLength <= 3 ? 8 : 4;
  }

  if (shape.flags.includes("balanced_odd_even")) {
    score += 8;
  }

  if (shape.flags.includes("balanced_high_low")) {
    score += 8;
  }

  if (shape.digitSumTone === "mid") {
    score += 6;
  }

  if (shape.maxRepeat >= 4) {
    score -= 25;
  } else if (shape.maxRepeat === shape.numberLength && shape.numberLength > 1) {
    score -= 35;
  } else if (shape.maxRepeat === 3 && shape.numberLength <= 3) {
    score -= 18;
  }

  return clamp(score);
}

export function getShapeReasons(number: string) {
  const shape = analyzeNumberShape(number);
  const reasons = [
    `Shape has ${shape.uniqueCount} unique digit${
      shape.uniqueCount === 1 ? "" : "s"
    } across ${shape.numberLength} positions.`,
    `Digit sum is ${shape.digitSum} (${shape.digitSumTone} range).`
  ];

  if (shape.maxRepeat > 1) {
    reasons.push(`Largest repeated digit group is ${shape.maxRepeat}.`);
  }

  if (shape.flags.includes("ascending_run")) {
    reasons.push("Contains an ascending run.");
  }

  if (shape.flags.includes("descending_run")) {
    reasons.push("Contains a descending run.");
  }

  if (shape.flags.includes("palindrome")) {
    reasons.push("Contains a palindrome / mirror shape.");
  }

  return reasons;
}

export function getMiniDna(number: string) {
  return [...number]
    .map((digit) => {
      const value = Number(digit);

      if (value % 2 === 0 && value >= 5) {
        return "E/H";
      }

      if (value % 2 === 0) {
        return "E/L";
      }

      return value >= 5 ? "O/H" : "O/L";
    })
    .join(" ");
}

export function getDigitSum(number: string) {
  return [...number].reduce((sum, digit) => sum + Number(digit), 0);
}

function getUniqueCountScore(numberLength: number, uniqueCount: number) {
  if (numberLength <= 2) {
    return uniqueCount === 1 ? 45 : 90;
  }

  if (numberLength === 3) {
    if (uniqueCount === 3) {
      return 88;
    }

    if (uniqueCount === 2) {
      return 70;
    }

    return 30;
  }

  const scoreByUniqueCount = new Map([
    [1, 5],
    [2, 30],
    [3, 68],
    [4, 92],
    [5, 100],
    [6, 78]
  ]);

  return scoreByUniqueCount.get(uniqueCount) ?? 50;
}

function getDigitSumTone(number: string): DigitSumTone {
  const sum = getDigitSum(number);

  if (sum <= number.length * 3) {
    return "low";
  }

  if (sum >= number.length * 6) {
    return "high";
  }

  return "mid";
}

function getMaxRepeatCount(digits: readonly number[]) {
  const counts = getDigitCounts(digits);

  return Math.max(0, ...counts.values());
}

function getRepeatGroupCount(digits: readonly number[], threshold: number) {
  return [...getDigitCounts(digits).values()].filter((count) => count >= threshold).length;
}

function getDigitCounts(digits: readonly number[]) {
  const counts = new Map<number, number>();

  for (const digit of digits) {
    counts.set(digit, (counts.get(digit) ?? 0) + 1);
  }

  return counts;
}

function isFullyAscending(digits: readonly number[]) {
  return (
    digits.length > 1 && digits.every((digit, index) => index === 0 || digit > digits[index - 1])
  );
}

function isFullyDescending(digits: readonly number[]) {
  return (
    digits.length > 1 && digits.every((digit, index) => index === 0 || digit < digits[index - 1])
  );
}

function hasAscendingRun(digits: readonly number[]) {
  return digits.some(
    (digit, index) =>
      index >= 2 && digits[index - 2] + 1 === digits[index - 1] && digits[index - 1] + 1 === digit
  );
}

function hasDescendingRun(digits: readonly number[]) {
  return digits.some(
    (digit, index) =>
      index >= 2 && digits[index - 2] - 1 === digits[index - 1] && digits[index - 1] - 1 === digit
  );
}

function hasBalancedOddEven(digits: readonly number[]) {
  const oddCount = digits.filter((digit) => digit % 2 === 1).length;

  return Math.abs(oddCount - (digits.length - oddCount)) <= 1;
}

function hasBalancedHighLow(digits: readonly number[]) {
  const highCount = digits.filter((digit) => digit >= 5).length;

  return Math.abs(highCount - (digits.length - highCount)) <= 1;
}

function isPalindrome(number: string) {
  return number.length > 1 && number === [...number].reverse().join("");
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, round(value)));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
