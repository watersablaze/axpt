-- AlterTable
ALTER TABLE "CaseReadModel" ADD COLUMN     "currentStage" TEXT;

-- CreateTable
CREATE TABLE "TreasuryPulseLog" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reasonsJson" JSONB,
    "totalsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryPulseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryAlertLog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "walletId" TEXT,
    "txHash" TEXT,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryAlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryAlertLog_fingerprint_key" ON "TreasuryAlertLog"("fingerprint");

-- CreateIndex
CREATE INDEX "DomainEvent_occurredAt_idx" ON "DomainEvent"("occurredAt");
