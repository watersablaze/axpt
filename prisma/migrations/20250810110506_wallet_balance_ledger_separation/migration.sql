/*
  Warnings:

  - You are about to drop the column `address` on the `Wallet` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[address]` on the table `BlockchainWallet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Wallet_address_key";

-- AlterTable
ALTER TABLE "BlockchainWallet" ADD COLUMN     "address" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "network" TEXT;

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "address",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Balance_tokenType_idx" ON "Balance"("tokenType");

-- CreateIndex
CREATE INDEX "Balance_tokenId_idx" ON "Balance"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainWallet_address_key" ON "BlockchainWallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
