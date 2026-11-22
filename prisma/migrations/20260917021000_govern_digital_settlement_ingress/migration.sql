ALTER TYPE "DigitalSettlementStatus"
    ADD VALUE 'AWAITING_VERIFICATION_TRANSFER';

ALTER TYPE "DigitalSettlementStatus"
    ADD VALUE 'VERIFICATION_CONFIRMED';

ALTER TABLE "DigitalSettlementInstruction"
    ADD COLUMN "receivingWalletId" TEXT,
    ADD COLUMN "receivingWalletRole" TEXT,
    ADD COLUMN "verificationAmountUsdt" DECIMAL(20, 6) NOT NULL DEFAULT 50,
    ADD COLUMN "verificationTxHash" TEXT,
    ADD COLUMN "verificationConfirmedAt" TIMESTAMP(3),
    ADD COLUMN "principalAuthorizedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "DigitalSettlementInstruction_verificationTxHash_key"
    ON "DigitalSettlementInstruction"("verificationTxHash");
