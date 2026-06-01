import { getPatternDefinitionById, type PatternDefinition } from "@/lib/app/pattern-playground";
import type {
  LotterySurvivalRoundRequest,
  LotterySurvivalStrategy,
  LotterySurvivalTicketPreviewItem
} from "@/schema/app/lottery-survival.schema";

export type LotterySurvivalRng = () => number;

export type BuildLotterySurvivalTicketsInput = {
  favoriteDigits?: readonly string[];
  manualTickets?: readonly string[];
  patternId?: string;
  rng?: LotterySurvivalRng;
  strategy: LotterySurvivalStrategy;
  ticketCount: number;
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const ODD_DIGITS = ["1", "3", "5", "7", "9"] as const;
const EVEN_DIGITS = ["0", "2", "4", "6", "8"] as const;
const HIGH_DIGITS = ["5", "6", "7", "8", "9"] as const;
const LOW_DIGITS = ["0", "1", "2", "3", "4"] as const;
const PATTERN_PRIZE_TYPE = "SIX_DIGIT_ALL";

export class LotterySurvivalTicketGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LotterySurvivalTicketGenerationError";
  }
}

export function createSeededLotterySurvivalRng(seed: string): LotterySurvivalRng {
  let state = hashSeed(seed);

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);

    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function buildLotterySurvivalTickets(
  input: BuildLotterySurvivalTicketsInput
): LotterySurvivalTicketPreviewItem[] {
  const manualTickets = normalizeManualTickets(input.manualTickets);

  if (manualTickets.length > input.ticketCount) {
    throw new LotterySurvivalTicketGenerationError("Manual tickets exceed the affordable count.");
  }

  const rng = input.rng ?? Math.random;
  const generatedCount = input.ticketCount - manualTickets.length;
  const generatedTickets = generateLotterySurvivalTicketNumbers({
    count: generatedCount,
    favoriteDigits: input.favoriteDigits,
    patternId: input.patternId,
    rng,
    strategy: input.strategy
  });

  return [
    ...manualTickets.map((number, index) => ({
      id: `manual-${index + 1}-${number}`,
      number,
      source: "manual" as const
    })),
    ...generatedTickets.map((number, index) => ({
      id: `generated-${index + 1}-${number}`,
      number,
      source: "generated" as const
    }))
  ];
}

export function generateLotterySurvivalTicketNumbers(input: {
  count: number;
  favoriteDigits?: readonly string[];
  patternId?: string;
  rng?: LotterySurvivalRng;
  strategy: LotterySurvivalRoundRequest["strategy"];
}): string[] {
  if (input.count <= 0) {
    return [];
  }

  const rng = input.rng ?? Math.random;
  const favoriteDigits = new Set(
    input.strategy === "favorite" || input.strategy === "patternFavorite"
      ? (input.favoriteDigits ?? [])
      : []
  );
  const patternDefinition = getPatternDefinition(input.strategy, input.patternId);

  return Array.from({ length: input.count }, () =>
    generateLotterySurvivalTicketNumber({
      favoriteDigits,
      patternDefinition,
      rng
    })
  );
}

export function normalizeManualTickets(tickets: readonly string[] | undefined): string[] {
  return (tickets ?? []).map((ticket) => ticket.trim());
}

function generateLotterySurvivalTicketNumber(input: {
  favoriteDigits: ReadonlySet<string>;
  patternDefinition?: PatternDefinition;
  rng: LotterySurvivalRng;
}): string {
  if (!input.patternDefinition) {
    return randomSixDigit(input.rng, input.favoriteDigits);
  }

  return generatePatternMatchedTicket(input.patternDefinition, input.rng, input.favoriteDigits);
}

function getPatternDefinition(strategy: LotterySurvivalStrategy, patternId: string | undefined) {
  if (strategy !== "pattern" && strategy !== "patternFavorite") {
    return undefined;
  }

  const definition = patternId
    ? getPatternDefinitionById(patternId, PATTERN_PRIZE_TYPE)
    : undefined;

  if (!definition) {
    throw new LotterySurvivalTicketGenerationError("Selected pattern is not available.");
  }

  return definition;
}

function generatePatternMatchedTicket(
  definition: PatternDefinition,
  rng: LotterySurvivalRng,
  favoriteDigits: ReadonlySet<string>
): string {
  switch (definition.id) {
    case "all_unique":
      return randomAllUniqueSixDigit(rng, favoriteDigits);
    case "balanced_high_low":
      return randomBalancedSixDigit(rng, favoriteDigits, LOW_DIGITS, HIGH_DIGITS);
    case "balanced_odd_even":
      return randomBalancedSixDigit(rng, favoriteDigits, EVEN_DIGITS, ODD_DIGITS);
    case "palindrome":
      return randomPalindromeSixDigit(rng, favoriteDigits);
    default:
      return randomByPredicate(definition.matches, rng, favoriteDigits);
  }
}

function randomByPredicate(
  matches: (number: string) => boolean,
  rng: LotterySurvivalRng,
  favoriteDigits: ReadonlySet<string>
): string {
  for (let attempt = 0; attempt < 20_000; attempt += 1) {
    const candidate = randomSixDigit(rng, favoriteDigits);

    if (matches(candidate)) {
      return candidate;
    }
  }

  const start = Math.floor(rng() * 1_000_000);

  for (let offset = 0; offset < 1_000_000; offset += 1) {
    const candidate = formatSixDigit((start + offset) % 1_000_000);

    if (matches(candidate)) {
      return candidate;
    }
  }

  throw new LotterySurvivalTicketGenerationError("Unable to generate a ticket for this pattern.");
}

function randomSixDigit(
  rng: LotterySurvivalRng,
  favoriteDigits: ReadonlySet<string> = new Set()
): string {
  return Array.from({ length: 6 }, () => pickWeightedDigit(DIGITS, favoriteDigits, rng)).join("");
}

function randomAllUniqueSixDigit(
  rng: LotterySurvivalRng,
  favoriteDigits: ReadonlySet<string>
): string {
  const available: string[] = [...DIGITS];
  const picked: string[] = [];

  while (picked.length < 6) {
    const digit = pickWeightedDigit(available, favoriteDigits, rng);
    const index = available.indexOf(digit);

    picked.push(digit);
    available.splice(index, 1);
  }

  return picked.join("");
}

function randomBalancedSixDigit(
  rng: LotterySurvivalRng,
  favoriteDigits: ReadonlySet<string>,
  leftDigits: readonly string[],
  rightDigits: readonly string[]
): string {
  const positions = shuffle([0, 1, 2, 3, 4, 5], rng);
  const number = Array.from({ length: 6 }, () => "0");

  for (let index = 0; index < positions.length; index += 1) {
    const source = index < 3 ? leftDigits : rightDigits;
    number[positions[index] ?? 0] = pickWeightedDigit(source, favoriteDigits, rng);
  }

  return number.join("");
}

function randomPalindromeSixDigit(
  rng: LotterySurvivalRng,
  favoriteDigits: ReadonlySet<string>
): string {
  const firstHalf = Array.from({ length: 3 }, () => pickWeightedDigit(DIGITS, favoriteDigits, rng));

  return [...firstHalf, ...[...firstHalf].reverse()].join("");
}

function pickWeightedDigit(
  digits: readonly string[],
  favoriteDigits: ReadonlySet<string>,
  rng: LotterySurvivalRng
): string {
  const totalWeight = digits.reduce((sum, digit) => sum + (favoriteDigits.has(digit) ? 3 : 1), 0);
  let cursor = rng() * totalWeight;

  for (const digit of digits) {
    cursor -= favoriteDigits.has(digit) ? 3 : 1;

    if (cursor <= 0) {
      return digit;
    }
  }

  return digits.at(-1) ?? "0";
}

function formatSixDigit(value: number): string {
  return String(value).padStart(6, "0").slice(-6);
}

function shuffle<T>(items: T[], rng: LotterySurvivalRng): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1));
    [items[index], items[target]] = [items[target] as T, items[index] as T];
  }

  return items;
}

function hashSeed(seed: string): number {
  let hash = 0;

  for (const char of seed) {
    hash = (Math.imul(31, hash) + char.charCodeAt(0)) | 0;
  }

  return hash || 1;
}
