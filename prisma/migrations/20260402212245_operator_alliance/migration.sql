-- CreateTable
CREATE TABLE "OperatorAlliance" (
    "id" TEXT NOT NULL,
    "operatorAId" TEXT NOT NULL,
    "operatorBId" TEXT NOT NULL,
    "alignmentScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "disagreementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorAlliance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorAlliance_operatorAId_operatorBId_key" ON "OperatorAlliance"("operatorAId", "operatorBId");
