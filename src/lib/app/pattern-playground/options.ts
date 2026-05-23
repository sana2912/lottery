import type { PatternDefinition, PatternTone } from "@/lib/app/pattern-playground/catalog";
import { roundPatternPercent } from "@/lib/app/pattern-playground/format";
import type { AnalysisPatternReadModel } from "@/schema/app/patterns.schema";

export type PatternPlaygroundOption = {
  hitCount: number;
  id: string;
  label: string;
  percent: number;
  tone: PatternTone;
  total: number;
};

function normalizeSnapshotPatternId(value: string) {
  return value.startsWith("pattern-") ? value.slice("pattern-".length) : value;
}

export function getSnapshotOverviewByPattern(snapshot: AnalysisPatternReadModel) {
  const overviewByPattern = new Map<string, AnalysisPatternReadModel["overview"][number]>();

  for (const overview of snapshot.overview) {
    overviewByPattern.set(normalizeSnapshotPatternId(overview.pattern ?? overview.id), overview);
  }

  return overviewByPattern;
}

export function resolvePatternOverviewHitCount(
  overviewByPattern: ReadonlyMap<string, AnalysisPatternReadModel["overview"][number]>,
  definition: PatternDefinition
) {
  const overview = overviewByPattern.get(definition.flag) ?? overviewByPattern.get(definition.id);

  return overview?.hitCount ?? 0;
}

export function buildPatternPlaygroundOptions(
  snapshot: AnalysisPatternReadModel,
  definitions: readonly PatternDefinition[]
): PatternPlaygroundOption[] {
  const overviewByPattern = getSnapshotOverviewByPattern(snapshot);
  const totalHits = snapshot.sampleSize;

  return definitions.map((definition) => {
    const hitCount = resolvePatternOverviewHitCount(overviewByPattern, definition);
    const percent = totalHits > 0 ? roundPatternPercent((hitCount / totalHits) * 100) : 0;

    return {
      hitCount,
      id: definition.id,
      label: definition.label,
      percent,
      tone: definition.tone,
      total: totalHits
    };
  });
}
