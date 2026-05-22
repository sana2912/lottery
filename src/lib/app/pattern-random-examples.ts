export type PatternRandomNumberLength = 2 | 3 | 6;

export type GenerateRandomPatternNumbersInput = {
  count: number;
  length: PatternRandomNumberLength;
  matches: (number: string) => boolean;
  maxAttemptsPerNumber?: number;
  rng?: () => number;
  seed?: string;
};

function formatLotteryNumber(value: number, length: number) {
  return String(value).padStart(length, "0").slice(-length);
}

function createRng(seed?: string) {
  if (!seed) {
    return Math.random;
  }

  let state = hashSeed(seed);

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function hashSeed(seed: string) {
  let hash = 0;

  for (const char of seed) {
    hash = (Math.imul(31, hash) + char.charCodeAt(0)) | 0;
  }

  return hash || 1;
}

export function generateRandomPatternNumbers(input: GenerateRandomPatternNumbersInput) {
  const rng = input.rng ?? createRng(input.seed);
  const maxValue = 10 ** input.length;
  const maxAttemptsPerNumber = input.maxAttemptsPerNumber ?? maxValue * 4;
  const found = new Set<string>();

  while (found.size < input.count) {
    let accepted = false;

    for (let attempt = 0; attempt < maxAttemptsPerNumber; attempt += 1) {
      const candidate = formatLotteryNumber(Math.floor(rng() * maxValue), input.length);

      if (found.has(candidate) || !input.matches(candidate)) {
        continue;
      }

      found.add(candidate);
      accepted = true;
      break;
    }

    if (!accepted) {
      break;
    }
  }

  return [...found];
}
