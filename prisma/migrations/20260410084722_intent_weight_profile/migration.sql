-- CreateTable
CREATE TABLE "IntentWeightProfile" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "successWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "patternWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntentWeightProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntentWeightProfile_intent_key" ON "IntentWeightProfile"("intent");
