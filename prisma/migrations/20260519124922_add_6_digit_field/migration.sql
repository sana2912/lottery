/*
  Warnings:

  - Changed the type of `prizeType` on the `analysis_calendar_heatmaps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `prizeType` on the `analysis_digit_stats` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `prizeType` on the `analysis_number_stats` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `prizeType` on the `analysis_pattern_summaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `prizeType` on the `analysis_snapshot_runs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "analysis_calendar_heatmaps" DROP COLUMN "prizeType",
ADD COLUMN     "prizeType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "analysis_digit_stats" DROP COLUMN "prizeType",
ADD COLUMN     "prizeType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "analysis_number_stats" DROP COLUMN "prizeType",
ADD COLUMN     "prizeType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "analysis_pattern_summaries" DROP COLUMN "prizeType",
ADD COLUMN     "prizeType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "analysis_snapshot_runs" DROP COLUMN "prizeType",
ADD COLUMN     "prizeType" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "analysis_heatmap_cell_idx" ON "analysis_calendar_heatmaps"("lotteryType", "prizeType", "scope", "month", "windowPreset", "position", "digit");

-- CreateIndex
CREATE INDEX "analysis_digit_position_idx" ON "analysis_digit_stats"("lotteryType", "prizeType", "windowPreset", "position", "digit");

-- CreateIndex
CREATE INDEX "analysis_number_value_idx" ON "analysis_number_stats"("lotteryType", "prizeType", "windowPreset", "number");

-- CreateIndex
CREATE INDEX "analysis_number_length_idx" ON "analysis_number_stats"("lotteryType", "prizeType", "windowPreset", "numberLength");

-- CreateIndex
CREATE INDEX "analysis_pattern_value_idx" ON "analysis_pattern_summaries"("lotteryType", "prizeType", "windowPreset", "pattern");

-- CreateIndex
CREATE INDEX "analysis_runs_context_idx" ON "analysis_snapshot_runs"("lotteryType", "prizeType", "scope", "month", "windowPreset");
