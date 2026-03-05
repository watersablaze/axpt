/*
  Warnings:

  - A unique constraint covering the columns `[chainId,contract]` on the table `ChainMirrorCursor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chainId,txHash,logIndex]` on the table `ChainMirrorEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChainMirrorCursor_network_contract_key";

-- DropIndex
DROP INDEX "ChainMirrorCursor_network_idx";

-- DropIndex
DROP INDEX "ChainMirrorEvent_network_blockNumber_idx";

-- DropIndex
DROP INDEX "ChainMirrorEvent_network_contract_idx";

-- DropIndex
DROP INDEX "ChainMirrorEvent_network_txHash_logIndex_key";

-- CreateIndex
CREATE INDEX "ChainMirrorCursor_chainId_idx" ON "ChainMirrorCursor"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorCursor_chainId_contract_key" ON "ChainMirrorCursor"("chainId", "contract");

-- CreateIndex
CREATE INDEX "ChainMirrorEvent_chainId_blockNumber_idx" ON "ChainMirrorEvent"("chainId", "blockNumber");

-- CreateIndex
CREATE INDEX "ChainMirrorEvent_chainId_contract_idx" ON "ChainMirrorEvent"("chainId", "contract");

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorEvent_chainId_txHash_logIndex_key" ON "ChainMirrorEvent"("chainId", "txHash", "logIndex");
