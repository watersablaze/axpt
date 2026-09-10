-- CreateEnum
CREATE TYPE "CommunicationOperationalRoomClass" AS ENUM ('GENERAL_OPERATIONS', 'TRANSACTION', 'TREASURY', 'DOSSIER', 'CASE', 'OPPORTUNITY');

-- CreateEnum
CREATE TYPE "CommunicationOperationalTargetType" AS ENUM ('CASE', 'OPPORTUNITY', 'TRANSACTION_DOSSIER', 'TRANSACTION', 'TREASURY_GATEWAY_AGGREGATE');

-- CreateTable
CREATE TABLE "CommunicationOperationalRoom" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "clientRoomId" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "roomClass" "CommunicationOperationalRoomClass" NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationOperationalRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationOperationalLink" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "targetType" "CommunicationOperationalTargetType" NOT NULL,
    "targetSubtype" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "linkedByUserId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationOperationalLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationOperationalRoom_conversationId_key" ON "CommunicationOperationalRoom"("conversationId");

-- CreateIndex
CREATE INDEX "CommunicationOperationalRoom_roomClass_updatedAt_idx" ON "CommunicationOperationalRoom"("roomClass", "updatedAt");

-- CreateIndex
CREATE INDEX "CommunicationOperationalRoom_createdByUserId_createdAt_idx" ON "CommunicationOperationalRoom"("createdByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationOperationalRoom_createdByUserId_clientRoomId_key" ON "CommunicationOperationalRoom"("createdByUserId", "clientRoomId");

-- CreateIndex
CREATE INDEX "CommunicationOperationalLink_targetType_targetSubtype_targe_idx" ON "CommunicationOperationalLink"("targetType", "targetSubtype", "targetId");

-- CreateIndex
CREATE INDEX "CommunicationOperationalLink_linkedByUserId_linkedAt_idx" ON "CommunicationOperationalLink"("linkedByUserId", "linkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationOperationalLink_roomId_targetType_targetSubtyp_key" ON "CommunicationOperationalLink"("roomId", "targetType", "targetSubtype", "targetId");

-- AddForeignKey
ALTER TABLE "CommunicationOperationalRoom" ADD CONSTRAINT "CommunicationOperationalRoom_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationOperationalRoom" ADD CONSTRAINT "CommunicationOperationalRoom_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationOperationalLink" ADD CONSTRAINT "CommunicationOperationalLink_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CommunicationOperationalRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationOperationalLink" ADD CONSTRAINT "CommunicationOperationalLink_linkedByUserId_fkey" FOREIGN KEY ("linkedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
