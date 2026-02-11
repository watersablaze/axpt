-- CreateTable
CREATE TABLE "ChainMirrorCursor" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "lastBlock" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChainMirrorCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainMirrorEvent" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "blockHash" TEXT,
    "chainTimestamp" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "walletEventId" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChainMirrorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChainMirrorCursor_network_idx" ON "ChainMirrorCursor"("network");

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorCursor_network_contract_key" ON "ChainMirrorCursor"("network", "contract");

-- CreateIndex
CREATE INDEX "ChainMirrorEvent_network_blockNumber_idx" ON "ChainMirrorEvent"("network", "blockNumber");

-- CreateIndex
CREATE INDEX "ChainMirrorEvent_network_contract_idx" ON "ChainMirrorEvent"("network", "contract");

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorEvent_network_txHash_logIndex_key" ON "ChainMirrorEvent"("network", "txHash", "logIndex");
