import { afterEach, describe, expect, test } from "bun:test";
import { assertAnalysisSnapshotSchemaReady } from "../../scripts/lib/assert-analysis-snapshot-schema";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("assertAnalysisSnapshotSchemaReady", () => {
  test("allows compute when legacy analysis columns are absent", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async () => []
    };

    await expect(assertAnalysisSnapshotSchemaReady()).resolves.toBeUndefined();
  });

  test("reports the migration when legacy analysis columns remain", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async () => [
        {
          columnName: "windowPreset",
          isNullable: "NO",
          tableName: "analysis_snapshot_runs"
        }
      ]
    };

    await expect(assertAnalysisSnapshotSchemaReady()).rejects.toThrow(
      /20260526000445_del_lagacy_windowsize/
    );
  });
});
