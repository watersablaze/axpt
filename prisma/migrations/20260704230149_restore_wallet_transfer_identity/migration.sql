/*
  Canonical migration repair.

  Historical production lineage did not contain Transaction.idempotencyKey.
  The former migration assumed the July 2026 squashed 0_baseline, where a
  non-unique Transaction_idempotencyKey_idx already existed.

  Canonical history establishes durable wallet transfer identity directly.
*/

-- AlterTable
ALTER TABLE "Transaction"
ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key"
ON "Transaction"("idempotencyKey");
