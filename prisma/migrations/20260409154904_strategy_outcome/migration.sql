-- CreateTable
CREATE TABLE "StrategyOutcome" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "success" BOOLEAN NOT NULL,
    "impactScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyOutcome_pkey" PRIMARY KEY ("id")
);
