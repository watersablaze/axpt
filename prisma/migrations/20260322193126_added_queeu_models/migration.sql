-- CreateTable
CREATE TABLE "QueueLock" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueItem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "urgency" INTEGER NOT NULL,
    "risk" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT true,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueHistory" (
    "id" TEXT NOT NULL,
    "queueItemId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "operatorId" TEXT,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueueLock_caseId_idx" ON "QueueLock"("caseId");

-- CreateIndex
CREATE INDEX "QueueItem_caseId_idx" ON "QueueItem"("caseId");

-- CreateIndex
CREATE INDEX "QueueItem_status_idx" ON "QueueItem"("status");

-- CreateIndex
CREATE INDEX "QueueItem_assignedTo_idx" ON "QueueItem"("assignedTo");

-- CreateIndex
CREATE INDEX "QueueHistory_queueItemId_idx" ON "QueueHistory"("queueItemId");

-- CreateIndex
CREATE INDEX "QueueHistory_caseId_idx" ON "QueueHistory"("caseId");
