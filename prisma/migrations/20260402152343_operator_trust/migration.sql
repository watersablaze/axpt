-- CreateTable
CREATE TABLE "OperatorTrust" (
    "id" TEXT NOT NULL,
    "fromOperatorId" TEXT NOT NULL,
    "toOperatorId" TEXT NOT NULL,
    "agreementCount" INTEGER NOT NULL DEFAULT 0,
    "disagreementCount" INTEGER NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorTrust_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorTrust_fromOperatorId_toOperatorId_key" ON "OperatorTrust"("fromOperatorId", "toOperatorId");
