CREATE TYPE "DigitalSettlementPricingStatus" AS ENUM (
    'PENDING_FIXING',
    'FIXED'
);

ALTER TABLE "DigitalSettlementInstruction"
    ADD COLUMN "counterpartyRepresentative" TEXT,
    ADD COLUMN "commodity" TEXT NOT NULL DEFAULT 'Au Dore Bars',
    ADD COLUMN "proceduralBasis" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "pricingStatus" "DigitalSettlementPricingStatus" NOT NULL DEFAULT 'PENDING_FIXING',
    ADD COLUMN "pricingBasis" TEXT NOT NULL DEFAULT 'Gold spot price less 10%',
    ADD COLUMN "spotDiscountPercentage" DECIMAL(7, 4) NOT NULL DEFAULT 10,
    ADD COLUMN "spotBenchmark" TEXT,
    ADD COLUMN "spotPricePerKgUsd" DECIMAL(20, 2),
    ADD COLUMN "priceFixedAt" TIMESTAMP(3),
    ALTER COLUMN "pricePerKgUsd" DROP NOT NULL,
    ALTER COLUMN "transactionValueUsd" DROP NOT NULL,
    ALTER COLUMN "settlementAmountUsd" DROP NOT NULL;
