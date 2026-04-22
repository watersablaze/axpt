-- CreateTable
CREATE TABLE "PredictiveExecution" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "assetCode" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "signalHash" TEXT NOT NULL,

    CONSTRAINT "PredictiveExecution_pkey" PRIMARY KEY ("id")
);
