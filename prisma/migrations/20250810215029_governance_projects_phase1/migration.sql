/*
  Warnings:

  - A unique constraint covering the columns `[walletId,tokenType,tokenId]` on the table `Balance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'FUNDED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "requestedAxg" DECIMAL(18,2) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectReview" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId", "status");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectReview_projectId_reviewerId_idx" ON "ProjectReview"("projectId", "reviewerId");

-- CreateIndex
CREATE INDEX "ProjectReview_createdAt_idx" ON "ProjectReview"("createdAt");

-- CreateIndex
CREATE INDEX "Balance_walletId_idx" ON "Balance"("walletId");

-- CreateIndex
CREATE INDEX "Balance_userId_idx" ON "Balance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_walletId_tokenType_tokenId_key" ON "Balance"("walletId", "tokenType", "tokenId");

-- CreateIndex
CREATE INDEX "ContractInteractionLog_contractId_createdAt_idx" ON "ContractInteractionLog"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractInteractionLog_userId_createdAt_idx" ON "ContractInteractionLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InvestmentProposal_userId_createdAt_idx" ON "InvestmentProposal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LogoutLog_userId_timestamp_idx" ON "LogoutLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "NFTBadge_userId_mintedAt_idx" ON "NFTBadge"("userId", "mintedAt");

-- CreateIndex
CREATE INDEX "NodeSyncStatus_userId_syncedAt_idx" ON "NodeSyncStatus"("userId", "syncedAt");

-- CreateIndex
CREATE INDEX "Session_userId_startedAt_idx" ON "Session"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "SessionActionLog_userId_timestamp_idx" ON "SessionActionLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "SessionLog_userId_timestamp_idx" ON "SessionLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "SimProfile_userId_createdAt_idx" ON "SimProfile"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Stake_userId_isActive_idx" ON "Stake"("userId", "isActive");

-- CreateIndex
CREATE INDEX "TokenAccessLog_token_accessedAt_idx" ON "TokenAccessLog"("token", "accessedAt");

-- CreateIndex
CREATE INDEX "TokenIssuanceRequest_requestedBy_createdAt_idx" ON "TokenIssuanceRequest"("requestedBy", "createdAt");

-- CreateIndex
CREATE INDEX "TokenIssuanceRequest_status_createdAt_idx" ON "TokenIssuanceRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_walletId_createdAt_idx" ON "Transaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_tokenId_idx" ON "Transaction"("tokenId");

-- CreateIndex
CREATE INDEX "Transaction_tokenType_idx" ON "Transaction"("tokenType");

-- AddForeignKey
ALTER TABLE "SessionActionLog" ADD CONSTRAINT "SessionActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoutLog" ADD CONSTRAINT "LogoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReview" ADD CONSTRAINT "ProjectReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReview" ADD CONSTRAINT "ProjectReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
