-- CreateTable
CREATE TABLE "InterventionDecision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterventionDecision_caseId_idx" ON "InterventionDecision"("caseId");
