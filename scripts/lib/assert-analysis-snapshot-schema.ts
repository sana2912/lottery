import { getPrisma } from "@/api/service/prisma";

type LegacyAnalysisColumnRow = {
  columnName: string;
  isNullable: "NO" | "YES";
  tableName: string;
};

const LEGACY_ANALYSIS_SCHEMA_MIGRATION = "20260526000445_del_lagacy_windowsize";

export async function assertAnalysisSnapshotSchemaReady() {
  const legacyColumns = await getPrisma().$queryRaw<LegacyAnalysisColumnRow[]>`
    SELECT
      table_name AS "tableName",
      column_name AS "columnName",
      is_nullable AS "isNullable"
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'analysis_snapshot_runs',
        'analysis_digit_stats',
        'analysis_number_stats',
        'analysis_pattern_summaries',
        'analysis_calendar_heatmaps'
      )
      AND column_name IN ('windowPreset', 'windowSize')
    ORDER BY table_name, column_name
  `;

  if (legacyColumns.length === 0) {
    return;
  }

  const columns = legacyColumns
    .map((column) => `${column.tableName}.${column.columnName}`)
    .join(", ");

  throw new Error(
    [
      `Database schema is behind Prisma migrations; found legacy analysis columns: ${columns}.`,
      `Apply migration ${LEGACY_ANALYSIS_SCHEMA_MIGRATION} with bun run db:migrate, or bun run db:push for a disposable local database.`,
      "Then rerun bun run db:compute-analysis."
    ].join(" ")
  );
}
