-- CreateTable
CREATE TABLE "OperatorProfile" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "totalDecisions" INTEGER NOT NULL DEFAULT 0,
    "approveCount" INTEGER NOT NULL DEFAULT 0,
    "delayCount" INTEGER NOT NULL DEFAULT 0,
    "overrideCount" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorProfile_operatorId_key" ON "OperatorProfile"("operatorId");
