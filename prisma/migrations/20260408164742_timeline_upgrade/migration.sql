/*
  Warnings:

  - You are about to drop the column `amount` on the `ChainMirrorEvent` table. All the data in the column will be lost.
  - Added the required column `amountBaseUnits` to the `ChainMirrorEvent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChainMirrorJobStatus" AS ENUM ('PENDING', 'CLAIMED', 'SUBMITTED', 'CONFIRMED', 'RETRYABLE', 'FAILED', 'DEAD_LETTER');

-- AlterTable
ALTER TABLE "Balance" ADD COLUMN     "amountBaseUnits" DECIMAL(78,0),
ADD COLUMN     "assetCode" TEXT;

-- AlterTable
ALTER TABLE "ChainMirrorEvent" DROP COLUMN "amount",
ADD COLUMN     "amountBaseUnits" DECIMAL(78,0) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "amountBaseUnits" DECIMAL(78,0),
ADD COLUMN     "assetCode" TEXT,
ADD COLUMN     "feeBaseUnits" DECIMAL(78,0);

-- CreateTable
CREATE TABLE "ChainMirrorJob" (
    "id" TEXT NOT NULL,
    "walletEventId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "amountBaseUnits" DECIMAL(78,0) NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "status" "ChainMirrorJobStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "claimOwner" TEXT,
    "claimedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "submittedTxHash" TEXT,
    "submittedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "deadLetteredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChainMirrorJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainSyncState" (
    "id" TEXT NOT NULL DEFAULT 'mirror',
    "lastBlock" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChainSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemState" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "globalPaused" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "pausedAssets" JSONB,
    "pausedLayers" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircuitEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircuitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorPowerSnapshot" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "power" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorPowerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChainMirrorJob_status_nextRetryAt_idx" ON "ChainMirrorJob"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "ChainMirrorJob_assetCode_idx" ON "ChainMirrorJob"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorJob_walletEventId_key" ON "ChainMirrorJob"("walletEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorJob_idempotencyKey_key" ON "ChainMirrorJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CircuitEvent_createdAt_idx" ON "CircuitEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Balance_assetCode_idx" ON "Balance"("assetCode");

-- CreateIndex
CREATE INDEX "Transaction_assetCode_idx" ON "Transaction"("assetCode");
