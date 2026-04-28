-- Tighten relational integrity and indexes used by current service read paths.

-- LotteryPrize is child data of LotteryDraw, so deleting a draw should remove its prize rows.
ALTER TABLE "lottery_prizes" DROP CONSTRAINT "lottery_prizes_drawId_fkey";
ALTER TABLE "lottery_prizes" ADD CONSTRAINT "lottery_prizes_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "lottery_draws"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BacktestResult.drawId is persisted from historical draws and should remain FK-checked.
ALTER TABLE "backtest_results" ADD CONSTRAINT "backtest_results_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "lottery_draws"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Service read paths order watchlist by updatedAt and backtest results by run/date.
CREATE INDEX "user_watchlist_items_updatedAt_idx" ON "user_watchlist_items"("updatedAt");
CREATE INDEX "backtest_results_runId_drawDate_idx" ON "backtest_results"("runId", "drawDate");
