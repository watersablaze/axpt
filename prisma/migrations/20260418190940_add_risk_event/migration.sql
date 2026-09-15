-- CreateTable
CREATE TABLE "RiskEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'RISK_EVALUATION',
    "userId" TEXT NOT NULL,
    "toUserId" TEXT,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" TEXT,
    "amountBaseUnits" DECIMAL(78,0) NOT NULL,
    "intent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiskEvent_userId_createdAt_idx" ON "RiskEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RiskEvent_eventType_createdAt_idx" ON "RiskEvent"("eventType", "createdAt");
