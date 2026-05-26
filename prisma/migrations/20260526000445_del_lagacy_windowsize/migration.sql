/*
  Warnings:

  - You are about to drop the column `windowPreset` on the `analysis_calendar_heatmaps` table. All the data in the column will be lost.
  - You are about to drop the column `windowPreset` on the `analysis_digit_stats` table. All the data in the column will be lost.
  - You are about to drop the column `windowPreset` on the `analysis_number_stats` table. All the data in the column will be lost.
  - You are about to drop the column `windowPreset` on the `analysis_pattern_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `windowPreset` on the `analysis_snapshot_runs` table. All the data in the column will be lost.
  - You are about to drop the column `windowSize` on the `analysis_snapshot_runs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "analysis_heatmap_cell_idx";

-- DropIndex
DROP INDEX "analysis_digit_position_idx";

-- DropIndex
DROP INDEX "analysis_number_length_idx";

-- DropIndex
DROP INDEX "analysis_number_value_idx";

-- DropIndex
DROP INDEX "analysis_pattern_value_idx";

-- DropIndex
DROP INDEX "analysis_runs_context_idx";

-- AlterTable
ALTER TABLE "analysis_calendar_heatmaps" DROP COLUMN "windowPreset";

-- AlterTable
ALTER TABLE "analysis_digit_stats" DROP COLUMN "windowPreset";

-- AlterTable
ALTER TABLE "analysis_number_stats" DROP COLUMN "windowPreset";

-- AlterTable
ALTER TABLE "analysis_pattern_summaries" DROP COLUMN "windowPreset";

-- AlterTable
ALTER TABLE "analysis_snapshot_runs" DROP COLUMN "windowPreset",
DROP COLUMN "windowSize";

-- CreateIndex
CREATE INDEX "analysis_heatmap_cell_idx" ON "analysis_calendar_heatmaps"("lotteryType", "prizeType", "scope", "month", "position", "digit");

-- CreateIndex
CREATE INDEX "analysis_digit_position_idx" ON "analysis_digit_stats"("lotteryType", "prizeType", "position", "digit");

-- CreateIndex
CREATE INDEX "analysis_number_run_number_idx" ON "analysis_number_stats"("runId", "number");

-- CreateIndex
CREATE INDEX "analysis_number_value_idx" ON "analysis_number_stats"("lotteryType", "prizeType", "number");

-- CreateIndex
CREATE INDEX "analysis_number_length_idx" ON "analysis_number_stats"("lotteryType", "prizeType", "numberLength");

-- CreateIndex
CREATE INDEX "analysis_pattern_value_idx" ON "analysis_pattern_summaries"("lotteryType", "prizeType", "pattern");

-- CreateIndex
CREATE INDEX "analysis_runs_context_idx" ON "analysis_snapshot_runs"("lotteryType", "prizeType", "scope", "month");

-- CreateIndex
CREATE INDEX "prediction_results_run_rank_created_idx" ON "prediction_results"("runId", "rank" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "prediction_runs_latest_idx" ON "prediction_runs"("generatedAt" DESC, "updatedAt" DESC);
