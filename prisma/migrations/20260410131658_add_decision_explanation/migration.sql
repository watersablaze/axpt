-- CreateTable
CREATE TABLE "DecisionExplanation" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "scenarioId" TEXT,
    "assetCode" TEXT,
    "systemState" TEXT,
    "summary" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionExplanation_intent_createdAt_idx" ON "DecisionExplanation"("intent", "createdAt");

-- CreateIndex
CREATE INDEX "DecisionExplanation_assetCode_idx" ON "DecisionExplanation"("assetCode");
