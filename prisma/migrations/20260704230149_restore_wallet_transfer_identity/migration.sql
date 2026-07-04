/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Transaction_idempotencyKey_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");
