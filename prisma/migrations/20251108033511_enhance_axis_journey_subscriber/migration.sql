-- CreateEnum
CREATE TYPE "InitiativeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InitiativeCategory" AS ENUM ('ENERGY', 'FINTECH', 'DATA', 'SECURITY', 'OTHER');

-- AlterTable
ALTER TABLE "GemIntake" ADD COLUMN     "internalNote" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new';

-- CreateTable
CREATE TABLE "AccessCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "humanCode" TEXT,
    "partner" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "email" TEXT,
    "docs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "displayName" TEXT,
    "greeting" TEXT,
    "popupMessage" TEXT,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "lastUsedIp" TEXT,

    CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "councilEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slackWebhookUrl" TEXT,
    "fromEmail" TEXT,
    "provider" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouncilSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "InitiativeCategory" NOT NULL DEFAULT 'OTHER',
    "status" "InitiativeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "fundingGoal" DECIMAL(18,2),
    "fundingReceived" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeUpdate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "InitiativeUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeFunding" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InitiativeFunding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadaWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CadaWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "axis_journey_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "origin" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmationAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "notes" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "axis_journey_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "from" TEXT,
    "to" TEXT,
    "subject" TEXT,
    "messageId" TEXT,
    "status" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_codeHash_key" ON "AccessCode"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "Initiative_slug_key" ON "Initiative"("slug");

-- CreateIndex
CREATE INDEX "Initiative_slug_idx" ON "Initiative"("slug");

-- CreateIndex
CREATE INDEX "Initiative_status_category_idx" ON "Initiative"("status", "category");

-- CreateIndex
CREATE INDEX "InitiativeUpdate_initiativeId_createdAt_idx" ON "InitiativeUpdate"("initiativeId", "createdAt");

-- CreateIndex
CREATE INDEX "InitiativeFunding_initiativeId_createdAt_idx" ON "InitiativeFunding"("initiativeId", "createdAt");

-- CreateIndex
CREATE INDEX "InitiativeFunding_userId_idx" ON "InitiativeFunding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CadaWaitlist_email_key" ON "CadaWaitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "axis_journey_subscribers_email_key" ON "axis_journey_subscribers"("email");

-- CreateIndex
CREATE INDEX "axis_journey_subscribers_confirmed_idx" ON "axis_journey_subscribers"("confirmed");

-- CreateIndex
CREATE INDEX "axis_journey_subscribers_joinedAt_idx" ON "axis_journey_subscribers"("joinedAt");

-- CreateIndex
CREATE INDEX "axis_journey_subscribers_origin_idx" ON "axis_journey_subscribers"("origin");

-- CreateIndex
CREATE INDEX "email_logs_type_idx" ON "email_logs"("type");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_createdAt_type_idx" ON "email_logs"("createdAt", "type");

-- CreateIndex
CREATE INDEX "email_logs_to_idx" ON "email_logs"("to");

-- CreateIndex
CREATE INDEX "email_logs_messageId_idx" ON "email_logs"("messageId");

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeUpdate" ADD CONSTRAINT "InitiativeUpdate_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeUpdate" ADD CONSTRAINT "InitiativeUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeFunding" ADD CONSTRAINT "InitiativeFunding_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeFunding" ADD CONSTRAINT "InitiativeFunding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
