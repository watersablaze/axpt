-- AlterTable
ALTER TABLE "StrategyOutcome" ADD COLUMN     "assetCode" TEXT;

-- CreateIndex
CREATE INDEX "StrategyOutcome_intent_scenarioId_idx" ON "StrategyOutcome"("intent", "scenarioId");

-- CreateIndex
CREATE INDEX "StrategyOutcome_assetCode_idx" ON "StrategyOutcome"("assetCode");

-- CreateIndex
CREATE INDEX "StrategyOutcome_createdAt_idx" ON "StrategyOutcome"("createdAt");
