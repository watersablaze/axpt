-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('TREASURY', 'USER', 'EXTERNAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "tokenType" TEXT NOT NULL,
    "type" "LedgerAccountType" NOT NULL,
    "label" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "tokenType" TEXT NOT NULL,
    "walletEventId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "chainTimestamp" TIMESTAMP(3),
    "accountId" TEXT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerAccount_chainId_tokenType_idx" ON "LedgerAccount"("chainId", "tokenType");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_chainId_tokenType_type_address_key" ON "LedgerAccount"("chainId", "tokenType", "type", "address");

-- CreateIndex
CREATE INDEX "LedgerEntry_chainId_walletEventId_idx" ON "LedgerEntry"("chainId", "walletEventId");

-- CreateIndex
CREATE INDEX "LedgerEntry_chainId_accountId_blockNumber_idx" ON "LedgerEntry"("chainId", "accountId", "blockNumber");

-- CreateIndex
CREATE INDEX "LedgerEntry_chainId_tokenType_idx" ON "LedgerEntry"("chainId", "tokenType");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_chainId_txHash_logIndex_direction_accountId_key" ON "LedgerEntry"("chainId", "txHash", "logIndex", "direction", "accountId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
