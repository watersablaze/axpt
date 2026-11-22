-- Add the settlement-instruction specialization without granting it any
-- authority to execute transfers or mutate Treasury balances.
ALTER TYPE "InstitutionalInstrumentKind" ADD VALUE 'DIGITAL_SETTLEMENT_INSTRUCTION';

CREATE TYPE "DigitalSettlementAsset" AS ENUM ('USDT');

CREATE TYPE "DigitalSettlementNetwork" AS ENUM ('ETHEREUM_ERC20');

CREATE TYPE "DigitalSettlementStatus" AS ENUM (
    'PENDING_ISSUANCE',
    'AWAITING_TRANSFER',
    'DETECTED',
    'CONFIRMING',
    'CONFIRMED',
    'FAILED_REVIEW',
    'CANCELLED'
);

CREATE TABLE "DigitalSettlementInstruction" (
    "id" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "counterpartyName" TEXT NOT NULL,
    "transactionDescription" TEXT NOT NULL,
    "settlementPurpose" TEXT NOT NULL,
    "quantityKg" DECIMAL(18,6) NOT NULL,
    "pricePerKgUsd" DECIMAL(20,2) NOT NULL,
    "transactionValueUsd" DECIMAL(20,2) NOT NULL,
    "settlementPercentage" DECIMAL(7,4) NOT NULL,
    "settlementAmountUsd" DECIMAL(20,2) NOT NULL,
    "settlementAsset" "DigitalSettlementAsset" NOT NULL,
    "settlementNetwork" "DigitalSettlementNetwork" NOT NULL,
    "receivingEntity" TEXT NOT NULL,
    "receivingAddress" TEXT,
    "settlementStatus" "DigitalSettlementStatus" NOT NULL DEFAULT 'PENDING_ISSUANCE',
    "settlementDetectedAt" TIMESTAMP(3),
    "settlementConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalSettlementInstruction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DigitalSettlementInstruction_instrumentId_key"
    ON "DigitalSettlementInstruction"("instrumentId");

CREATE UNIQUE INDEX "DigitalSettlementInstruction_publicId_key"
    ON "DigitalSettlementInstruction"("publicId");

CREATE INDEX "DigitalSettlementInstruction_settlementStatus_idx"
    ON "DigitalSettlementInstruction"("settlementStatus");

CREATE INDEX "DigitalSettlementInstruction_settlementAsset_settlementNetwork_idx"
    ON "DigitalSettlementInstruction"("settlementAsset", "settlementNetwork");

ALTER TABLE "DigitalSettlementInstruction"
    ADD CONSTRAINT "DigitalSettlementInstruction_instrumentId_fkey"
    FOREIGN KEY ("instrumentId") REFERENCES "InstitutionalInstrument"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
