import {
  getPatternDefinitionById,
  getPatternDefinitionsForPrizeType
} from "@/lib/app/pattern-playground/catalog";

export function normalizePatternIdsForPrize(
  patternIds: readonly string[],
  prizeType: string
): string[] {
  const allowedIds = new Set(
    getPatternDefinitionsForPrizeType(prizeType).map((definition) => definition.id)
  );

  return patternIds.filter((patternId) => allowedIds.has(patternId));
}

export function matchesAllPatternIds(
  number: string,
  patternIds: readonly string[],
  prizeType: string
): boolean {
  if (patternIds.length === 0) {
    return true;
  }

  return patternIds.every((patternId) => {
    const definition = getPatternDefinitionById(patternId, prizeType);

    return definition ? definition.matches(number) : false;
  });
}
