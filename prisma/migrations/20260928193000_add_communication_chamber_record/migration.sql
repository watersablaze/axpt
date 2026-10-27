-- CreateEnum
CREATE TYPE "CommunicationChamberClass" AS ENUM ('ADDRESS', 'NOTICE', 'PETITION', 'ACKNOWLEDGMENT', 'RESPONSE', 'DECISION_NOTICE');

-- CreateEnum
CREATE TYPE "CommunicationChamberAddresseeType" AS ENUM ('CHAMBER', 'COUNCIL', 'PARTICIPANT', 'PARTICIPANTS', 'OFFICE');

-- CreateTable
CREATE TABLE "CommunicationChamberRecord" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "operationalRoomId" TEXT NOT NULL,
    "communicationClass" "CommunicationChamberClass" NOT NULL,
    "subject" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "enteredByUserId" TEXT NOT NULL,
    "authorCapacityKey" TEXT NOT NULL,
    "authorCapacityLabel" TEXT NOT NULL,
    "addresseeType" "CommunicationChamberAddresseeType" NOT NULL,
    "addresseeSnapshot" JSONB NOT NULL,
    "bodyHash" TEXT NOT NULL,
    "enteredIntoRecordAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondsToRecordId" TEXT,
    "supersedesRecordId" TEXT,

    CONSTRAINT "CommunicationChamberRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationChamberRecord_messageId_key" ON "CommunicationChamberRecord"("messageId");

-- CreateIndex
CREATE INDEX "CommunicationChamberRecord_conversationId_enteredIntoRecord_idx" ON "CommunicationChamberRecord"("conversationId", "enteredIntoRecordAt");

-- CreateIndex
CREATE INDEX "CommunicationChamberRecord_operationalRoomId_enteredIntoRec_idx" ON "CommunicationChamberRecord"("operationalRoomId", "enteredIntoRecordAt");

-- CreateIndex
CREATE INDEX "CommunicationChamberRecord_authorUserId_enteredIntoRecordAt_idx" ON "CommunicationChamberRecord"("authorUserId", "enteredIntoRecordAt");

-- CreateIndex
CREATE INDEX "CommunicationChamberRecord_enteredByUserId_enteredIntoRecor_idx" ON "CommunicationChamberRecord"("enteredByUserId", "enteredIntoRecordAt");

-- CreateIndex
CREATE INDEX "CommunicationChamberRecord_communicationClass_enteredIntoRe_idx" ON "CommunicationChamberRecord"("communicationClass", "enteredIntoRecordAt");

-- AddForeignKey
ALTER TABLE "CommunicationChamberRecord" ADD CONSTRAINT "CommunicationChamberRecord_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CommunicationMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationChamberRecord" ADD CONSTRAINT "CommunicationChamberRecord_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationChamberRecord" ADD CONSTRAINT "CommunicationChamberRecord_operationalRoomId_fkey" FOREIGN KEY ("operationalRoomId") REFERENCES "CommunicationOperationalRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationChamberRecord" ADD CONSTRAINT "CommunicationChamberRecord_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationChamberRecord" ADD CONSTRAINT "CommunicationChamberRecord_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationChamberRecord" ADD CONSTRAINT "CommunicationChamberRecord_respondsToRecordId_fkey" FOREIGN KEY ("respondsToRecordId") REFERENCES "CommunicationChamberRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationChamberRecord" ADD CONSTRAINT "CommunicationChamberRecord_supersedesRecordId_fkey" FOREIGN KEY ("supersedesRecordId") REFERENCES "CommunicationChamberRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
