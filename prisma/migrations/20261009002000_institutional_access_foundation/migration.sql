-- CreateEnum
CREATE TYPE "InstitutionalAccessScope" AS ENUM ('PROFILE_VIEW', 'LOI_INTAKE_ACCESS');

-- CreateEnum
CREATE TYPE "InstitutionalAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "InstitutionalAccessEventType" AS ENUM ('REQUESTED', 'APPROVED', 'DECLINED', 'WITHDRAWN', 'GRANTED', 'REVOKED', 'VIEWED', 'INTAKE_SUBMITTED');

-- CreateTable
CREATE TABLE "InstitutionalAccessRequest" (
    "id" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "institutionalAffiliation" TEXT NOT NULL,
    "requesterCapacity" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" "InstitutionalAccessScope" NOT NULL,
    "resourceReference" TEXT NOT NULL,
    "resourceVersion" INTEGER NOT NULL,
    "status" "InstitutionalAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decisionPolicy" TEXT,
    "decisionReason" TEXT,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionalAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalAccessGrant" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "scope" "InstitutionalAccessScope" NOT NULL,
    "resourceReference" TEXT NOT NULL,
    "resourceVersion" INTEGER NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "firstAccessAt" TIMESTAMP(3),
    "lastAccessAt" TIMESTAMP(3),

    CONSTRAINT "InstitutionalAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalAccessEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "grantId" TEXT,
    "type" "InstitutionalAccessEventType" NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalAccessEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionalAccessRequest_status_createdAt_idx" ON "InstitutionalAccessRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "InstitutionalAccessRequest_requesterEmail_scope_idx" ON "InstitutionalAccessRequest"("requesterEmail", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalAccessGrant_requestId_key" ON "InstitutionalAccessGrant"("requestId");

-- CreateIndex
CREATE INDEX "InstitutionalAccessGrant_recipientUserId_scope_expiresAt_idx" ON "InstitutionalAccessGrant"("recipientUserId", "scope", "expiresAt");

-- CreateIndex
CREATE INDEX "InstitutionalAccessGrant_resourceReference_resourceVersion_idx" ON "InstitutionalAccessGrant"("resourceReference", "resourceVersion");

-- CreateIndex
CREATE INDEX "InstitutionalAccessEvent_requestId_occurredAt_idx" ON "InstitutionalAccessEvent"("requestId", "occurredAt");

-- CreateIndex
CREATE INDEX "InstitutionalAccessEvent_grantId_occurredAt_idx" ON "InstitutionalAccessEvent"("grantId", "occurredAt");

-- AddForeignKey
ALTER TABLE "InstitutionalAccessRequest" ADD CONSTRAINT "InstitutionalAccessRequest_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalAccessGrant" ADD CONSTRAINT "InstitutionalAccessGrant_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InstitutionalAccessRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalAccessGrant" ADD CONSTRAINT "InstitutionalAccessGrant_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalAccessGrant" ADD CONSTRAINT "InstitutionalAccessGrant_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalAccessEvent" ADD CONSTRAINT "InstitutionalAccessEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InstitutionalAccessRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalAccessEvent" ADD CONSTRAINT "InstitutionalAccessEvent_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "InstitutionalAccessGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalAccessEvent" ADD CONSTRAINT "InstitutionalAccessEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
