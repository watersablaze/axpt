-- CreateEnum
CREATE TYPE "CommunicationConversationKind" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "CommunicationConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommunicationMemberRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "CommunicationMessageKind" AS ENUM ('TEXT', 'SYSTEM', 'NOTICE', 'REQUEST', 'DECISION', 'APPROVAL_REQUEST', 'STATUS_UPDATE', 'DOCUMENT_REFERENCE');

-- CreateTable
CREATE TABLE "CommunicationConversation" (
    "id" TEXT NOT NULL,
    "kind" "CommunicationConversationKind" NOT NULL,
    "status" "CommunicationConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT,
    "directKey" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "CommunicationConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CommunicationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "CommunicationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "kind" "CommunicationMessageKind" NOT NULL DEFAULT 'TEXT',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationConversation_directKey_key" ON "CommunicationConversation"("directKey");

-- CreateIndex
CREATE INDEX "CommunicationConversation_createdByUserId_createdAt_idx" ON "CommunicationConversation"("createdByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationConversation_status_updatedAt_idx" ON "CommunicationConversation"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "CommunicationMember_userId_leftAt_idx" ON "CommunicationMember"("userId", "leftAt");

-- CreateIndex
CREATE INDEX "CommunicationMember_conversationId_leftAt_idx" ON "CommunicationMember"("conversationId", "leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationMember_conversationId_userId_key" ON "CommunicationMember"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_conversationId_createdAt_idx" ON "CommunicationMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationMessage_senderUserId_createdAt_idx" ON "CommunicationMessage"("senderUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunicationConversation" ADD CONSTRAINT "CommunicationConversation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMember" ADD CONSTRAINT "CommunicationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMember" ADD CONSTRAINT "CommunicationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMember" ADD CONSTRAINT "CommunicationMember_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "CommunicationMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
