-- CreateTable
CREATE TABLE "CommunicationOperationalReflection" (
    "id" TEXT NOT NULL,
    "operationalRoomId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "sourceAggregateType" TEXT NOT NULL,
    "sourceAggregateId" TEXT NOT NULL,
    "sourceEventType" TEXT NOT NULL,
    "sourceOccurredAt" TIMESTAMP(3) NOT NULL,
    "targetType" "CommunicationOperationalTargetType" NOT NULL,
    "targetSubtype" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reflectionType" TEXT NOT NULL,
    "reflectionCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationOperationalReflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunicationOperationalReflection_operationalRoomId_source_idx" ON "CommunicationOperationalReflection"("operationalRoomId", "sourceOccurredAt");

-- CreateIndex
CREATE INDEX "CommunicationOperationalReflection_targetType_targetSubtype_idx" ON "CommunicationOperationalReflection"("targetType", "targetSubtype", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationOperationalReflection_operationalRoomId_source_key" ON "CommunicationOperationalReflection"("operationalRoomId", "sourceSystem", "sourceEventId");

-- AddForeignKey
ALTER TABLE "CommunicationOperationalReflection" ADD CONSTRAINT "CommunicationOperationalReflection_operationalRoomId_fkey" FOREIGN KEY ("operationalRoomId") REFERENCES "CommunicationOperationalRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
