/** Markdown summary for analysis-normalization audit JSON (human review only). */

export type NormalizationAuditReport = {
  calendarHeatmapDiagnostics: Array<{ prizeType: string }>;
  database: { dateRange: { end: string | null; start: string | null }; drawCount: number };
  generatedAt: string;
  heatmapMatrixDiagnostics: Array<{
    eventCountMismatchCount: number;
    month: number | null;
    prizeType: string;
    scope: string;
  }>;
  moduleAudit: Array<{ module: string; risk: string; surfaces: string[] }>;
  numberStatsMatrixDiagnostics: Array<{
    maxDrawDenominatorInflationFactor: number;
    prizeType: string;
    scope: string;
  }>;
  snapshotCoverage: {
    currentEngineVersion: string;
    expectedCount: number;
    existingCount: number;
    legacyEngineCount: number;
    missingCount: number;
  };
  threeDigitPrizeDecision: {
    recommendation: string;
  };
  warnings: string[];
};

export function buildNormalizationAuditMarkdown(report: NormalizationAuditReport) {
  const criticalWarnings = report.warnings.filter(
    (warning) => warning.includes("eventCount mismatch") || warning.includes("eventCountSum")
  );

  return `# Analysis normalization audit

Generated: ${report.generatedAt}

## Summary

- Draws: **${report.database.drawCount}** (${report.database.dateRange.start ?? "?"} → ${report.database.dateRange.end ?? "?"})
- Snapshots (${report.snapshotCoverage.currentEngineVersion}): **${report.snapshotCoverage.existingCount} / ${report.snapshotCoverage.expectedCount}** (missing ${report.snapshotCoverage.missingCount}, legacy ${report.snapshotCoverage.legacyEngineCount})
- THREE_DIGIT: **${report.threeDigitPrizeDecision.recommendation}**
- Critical heatmap warnings: **${criticalWarnings.length}** (total warnings: **${report.warnings.length}**)

## Modules

| Module | Risk | Surfaces |
| --- | --- | --- |
${report.moduleAudit.map((row) => `| ${row.module} | ${row.risk} | ${row.surfaces.join(", ")} |`).join("\n")}

## Heatmap matrix (sample)

| Prize | Scope | Month | Event mismatches |
| --- | --- | --- | --- |
${report.heatmapMatrixDiagnostics
  .slice(0, 40)
  .map(
    (row) =>
      `| ${row.prizeType} | ${row.scope} | ${row.month ?? "ALL"} | ${row.eventCountMismatchCount} |`
  )
  .join("\n")}

## Number-stats inflation (sample)

| Prize | Scope | Max inflation |
| --- | --- | --- |
${report.numberStatsMatrixDiagnostics
  .slice(0, 24)
  .map((row) => `| ${row.prizeType} | ${row.scope} | ${row.maxDrawDenominatorInflationFactor}x |`)
  .join("\n")}

## Warnings

${report.warnings.length > 0 ? report.warnings.map((warning) => `- ${warning}`).join("\n") : "- None"}

## After engine or formula changes

\`\`\`bash
bun run db:compute-analysis
bun run db:audit:analysis
\`\`\`
`;
}
