-- CreateTable
CREATE TABLE "ReplayAudit" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "originalIntent" TEXT NOT NULL,
    "replayIntent" TEXT,
    "intentChanged" BOOLEAN NOT NULL,
    "addedFactors" JSONB NOT NULL,
    "removedFactors" JSONB NOT NULL,
    "divergenceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplayAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReplayAudit_decisionId_idx" ON "ReplayAudit"("decisionId");

-- CreateIndex
CREATE INDEX "ReplayAudit_createdAt_idx" ON "ReplayAudit"("createdAt");

-- CreateIndex
CREATE INDEX "ReplayAudit_intentChanged_idx" ON "ReplayAudit"("intentChanged");
