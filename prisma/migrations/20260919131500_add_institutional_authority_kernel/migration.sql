-- CreateEnum
CREATE TYPE "InstitutionalAuthority" AS ENUM (
  'ACCESS',
  'INTRODUCTION',
  'COMMUNICATION',
  'PRESENTATION',
  'COORDINATION',
  'NEGOTIATION',
  'DOCUMENT_PREPARATION',
  'DOCUMENT_REVIEW',
  'DOCUMENT_APPROVAL',
  'COMMERCIAL_REVIEW',
  'COMMERCIAL_APPROVAL',
  'LEGAL_REVIEW',
  'FIDUCIARY_REVIEW',
  'FIDUCIARY_APPROVAL',
  'OPERATION_ASSIGNMENT',
  'OPERATION_SUSPENSION',
  'TRANSACTION_INITIATION',
  'TRANSACTION_REVIEW',
  'TRANSACTION_APPROVAL',
  'TREASURY_REQUEST',
  'TREASURY_REVIEW',
  'TREASURY_APPROVAL',
  'TREASURY_EXECUTION',
  'INSTRUMENT_CREATION',
  'INSTRUMENT_ISSUANCE',
  'GOVERNANCE_ADMINISTRATION',
  'SYSTEM_ADMINISTRATION'
);

-- CreateEnum
CREATE TYPE "InstitutionalAuthorityScopeType" AS ENUM (
  'GLOBAL',
  'ORGANIZATIONAL_UNIT',
  'TRANSACTION',
  'TRANSACTION_DOSSIER',
  'CASE',
  'INSTITUTIONAL_INSTRUMENT',
  'COUNTERPARTY',
  'TREASURY_AGGREGATE'
);

-- CreateEnum
CREATE TYPE "InstitutionalAuthorityGrantStatus" AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'REVOKED',
  'EXPIRED'
);

-- CreateTable
CREATE TABLE "InstitutionalAuthorityGrant" (
  "id" TEXT NOT NULL,
  "recipientProfileId" TEXT NOT NULL,
  "issuedByProfileId" TEXT NOT NULL,
  "authority" "InstitutionalAuthority" NOT NULL,
  "scopeType" "InstitutionalAuthorityScopeType" NOT NULL DEFAULT 'GLOBAL',
  "scopeId" TEXT,
  "status" "InstitutionalAuthorityGrantStatus" NOT NULL DEFAULT 'ACTIVE',
  "conditions" JSONB,
  "rationale" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),

  CONSTRAINT "InstitutionalAuthorityGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionalAuthorityGrant_recipientProfileId_status_idx"
ON "InstitutionalAuthorityGrant"("recipientProfileId", "status");

-- CreateIndex
CREATE INDEX "InstitutionalAuthorityGrant_authority_status_idx"
ON "InstitutionalAuthorityGrant"("authority", "status");

-- CreateIndex
CREATE INDEX "InstitutionalAuthorityGrant_scopeType_scopeId_idx"
ON "InstitutionalAuthorityGrant"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "InstitutionalAuthorityGrant_issuedByProfileId_idx"
ON "InstitutionalAuthorityGrant"("issuedByProfileId");

-- CreateIndex
CREATE INDEX "InstitutionalAuthorityGrant_expiresAt_idx"
ON "InstitutionalAuthorityGrant"("expiresAt");

-- AddForeignKey
ALTER TABLE "InstitutionalAuthorityGrant"
ADD CONSTRAINT "InstitutionalAuthorityGrant_recipientProfileId_fkey"
FOREIGN KEY ("recipientProfileId") REFERENCES "InstitutionalProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalAuthorityGrant"
ADD CONSTRAINT "InstitutionalAuthorityGrant_issuedByProfileId_fkey"
FOREIGN KEY ("issuedByProfileId") REFERENCES "InstitutionalProfile"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
