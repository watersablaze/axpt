/*
  Warnings:

  - Added the required column `retryCount` to the `TreasuryExecutionQueue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TreasuryExecutionQueue" ADD COLUMN     "retryCount" INTEGER NOT NULL,
ADD COLUMN     "transactionId" TEXT;
