-- CreateTable
CREATE TABLE "CommunicationReflectionIntakeCursor" (
    "sourceSystem" TEXT NOT NULL,
    "lastSequence" BIGINT NOT NULL,
    "lastEventId" TEXT,
    "initializedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationReflectionIntakeCursor_pkey" PRIMARY KEY ("sourceSystem")
);
