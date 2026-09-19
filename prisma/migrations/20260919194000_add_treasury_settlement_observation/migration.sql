-- CreateEnum
CREATE TYPE "TreasurySettlementObservationDirection" AS ENUM (
  'IN',
  'OUT'
);

-- CreateEnum
CREATE TYPE "TreasurySettlementObservationStatus" AS ENUM (
  'DETECTED',
  'VALIDATED',
  'CONFIRMING',
  'CONFIRMED',
  'FAILED',
  'ORPHANED'
);

-- CreateTable
CREATE TABLE "TreasurySettlementObservation" (
  "id" TEXT NOT NULL,

  "chainId" INTEGER NOT NULL,
  "network" TEXT NOT NULL,

  "tokenContractAddress" TEXT NOT NULL,

  "txHash" TEXT NOT NULL,
  "logIndex" INTEGER NOT NULL,

  "blockNumber" BIGINT NOT NULL,
  "blockHash" TEXT,

  "fromAddress" TEXT NOT NULL,
  "toAddress" TEXT NOT NULL,

  "amountBaseUnits" DECIMAL(78,0) NOT NULL,

  "direction" "TreasurySettlementObservationDirection" NOT NULL,
  "status" "TreasurySettlementObservationStatus" NOT NULL DEFAULT 'DETECTED',

  "detectedAt" TIMESTAMP(3) NOT NULL,
  "validatedAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),

  "confirmationCount" INTEGER NOT NULL DEFAULT 0,
  "requiredConfirmations" INTEGER NOT NULL,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TreasurySettlementObservation_pkey"
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasurySettlementObservationCursor" (
  "id" TEXT NOT NULL,

  "chainId" INTEGER NOT NULL,
  "network" TEXT NOT NULL,

  "tokenContractAddress" TEXT NOT NULL,
  "watchedAddress" TEXT NOT NULL,

  "lastScannedBlock" BIGINT NOT NULL,
  "lastScannedBlockHash" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TreasurySettlementObservationCursor_pkey"
    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX
  "TreasurySettlementObservation_chainId_txHash_logIndex_key"
ON "TreasurySettlementObservation"(
  "chainId",
  "txHash",
  "logIndex"
);

-- CreateIndex
CREATE INDEX
  "TreasurySettlementObservation_chainId_tokenContractAddress_toAddress_status_idx"
ON "TreasurySettlementObservation"(
  "chainId",
  "tokenContractAddress",
  "toAddress",
  "status"
);

-- CreateIndex
CREATE INDEX
  "TreasurySettlementObservation_status_blockNumber_idx"
ON "TreasurySettlementObservation"(
  "status",
  "blockNumber"
);

-- CreateIndex
CREATE INDEX
  "TreasurySettlementObservation_txHash_idx"
ON "TreasurySettlementObservation"(
  "txHash"
);

-- CreateIndex
CREATE UNIQUE INDEX
  "TreasurySettlementObservationCursor_chainId_tokenContractAddress_watchedAddress_key"
ON "TreasurySettlementObservationCursor"(
  "chainId",
  "tokenContractAddress",
  "watchedAddress"
);

-- CreateIndex
CREATE INDEX
  "TreasurySettlementObservationCursor_chainId_updatedAt_idx"
ON "TreasurySettlementObservationCursor"(
  "chainId",
  "updatedAt"
);
