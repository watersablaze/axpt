-- CreateTable
CREATE TABLE "TreasuryGatewayAggregate" (
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryGatewayAggregate_pkey" PRIMARY KEY ("aggregateType","aggregateId")
);

-- CreateTable
CREATE TABLE "TreasuryGatewayEvent" (
    "sequence" BIGSERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateVersion" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "authorityGrantId" TEXT,
    "correlationId" TEXT NOT NULL,
    "causationId" TEXT,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousEventHash" TEXT,
    "eventHash" TEXT,

    CONSTRAINT "TreasuryGatewayEvent_pkey" PRIMARY KEY ("sequence")
);

-- CreateIndex
CREATE INDEX "TreasuryGatewayAggregate_aggregateType_status_idx" ON "TreasuryGatewayAggregate"("aggregateType", "status");

-- CreateIndex
CREATE INDEX "TreasuryGatewayAggregate_updatedAt_idx" ON "TreasuryGatewayAggregate"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryGatewayEvent_eventId_key" ON "TreasuryGatewayEvent"("eventId");

-- CreateIndex
CREATE INDEX "TreasuryGatewayEvent_aggregateType_aggregateId_sequence_idx" ON "TreasuryGatewayEvent"("aggregateType", "aggregateId", "sequence");

-- CreateIndex
CREATE INDEX "TreasuryGatewayEvent_correlationId_idx" ON "TreasuryGatewayEvent"("correlationId");

-- CreateIndex
CREATE INDEX "TreasuryGatewayEvent_eventType_recordedAt_idx" ON "TreasuryGatewayEvent"("eventType", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryGatewayEvent_aggregateType_aggregateId_aggregateVer_key" ON "TreasuryGatewayEvent"("aggregateType", "aggregateId", "aggregateVersion");
