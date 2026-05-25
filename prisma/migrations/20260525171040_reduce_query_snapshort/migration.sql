-- CreateIndex
CREATE INDEX "analysis_digit_run_rank_idx" ON "analysis_digit_stats"("runId", "hitCount" DESC);

-- CreateIndex
CREATE INDEX "analysis_number_run_rank_idx" ON "analysis_number_stats"("runId", "trendScore" DESC, "hitCount" DESC);

-- CreateIndex
CREATE INDEX "analysis_number_run_missing_idx" ON "analysis_number_stats"("runId", "missingDrawCount" DESC);
