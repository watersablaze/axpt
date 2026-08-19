-- CreateTable
CREATE TABLE "TreasuryGatewayCommandReceipt" (
    "idempotencyKey" TEXT NOT NULL,
    "commandId" TEXT NOT NULL,
    "commandKind" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryGatewayCommandReceipt_pkey" PRIMARY KEY ("idempotencyKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryGatewayCommandReceipt_commandId_key" ON "TreasuryGatewayCommandReceipt"("commandId");

-- CreateIndex
CREATE INDEX "TreasuryGatewayCommandReceipt_aggregateType_aggregateId_idx" ON "TreasuryGatewayCommandReceipt"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "TreasuryGatewayCommandReceipt_correlationId_idx" ON "TreasuryGatewayCommandReceipt"("correlationId");

-- CreateIndex
CREATE INDEX "TreasuryGatewayCommandReceipt_createdAt_idx" ON "TreasuryGatewayCommandReceipt"("createdAt");
