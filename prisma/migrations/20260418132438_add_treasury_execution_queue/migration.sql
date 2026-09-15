-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "intent" TEXT;

-- CreateTable
CREATE TABLE "TreasuryAction" (
    "id" TEXT NOT NULL,
    "initiatorUserId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "amountBaseUnits" DECIMAL(65,30) NOT NULL,
    "intent" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3),
    "executionError" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryApproval" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryExecutionQueue" (
    "id" TEXT NOT NULL,
    "treasuryActionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "claimOwner" TEXT,
    "claimedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryExecutionQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryAction_idempotencyKey_key" ON "TreasuryAction"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryApproval_actionId_approverUserId_key" ON "TreasuryApproval"("actionId", "approverUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryExecutionQueue_treasuryActionId_key" ON "TreasuryExecutionQueue"("treasuryActionId");

-- AddForeignKey
ALTER TABLE "TreasuryApproval" ADD CONSTRAINT "TreasuryApproval_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "TreasuryAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
