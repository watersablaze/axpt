-- CreateTable
CREATE TABLE "NotificationReadModel" (
    "id" TEXT NOT NULL,
    "actorRole" TEXT,
    "actorUserId" TEXT,
    "caseId" TEXT,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationReadModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseReadModel" (
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "workflowType" TEXT,
    "currentGateName" TEXT,
    "nextActionLabel" TEXT,
    "responsibleRole" TEXT,
    "escrowStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseReadModel_pkey" PRIMARY KEY ("caseId")
);

-- CreateIndex
CREATE INDEX "NotificationReadModel_actorUserId_idx" ON "NotificationReadModel"("actorUserId");

-- CreateIndex
CREATE INDEX "NotificationReadModel_caseId_idx" ON "NotificationReadModel"("caseId");

-- CreateIndex
CREATE INDEX "CaseReadModel_status_idx" ON "CaseReadModel"("status");
