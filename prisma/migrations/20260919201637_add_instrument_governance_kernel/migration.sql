-- ============================================================================
-- AXPT INSTITUTIONAL INSTRUMENT GOVERNANCE KERNEL
--
-- Additive governance sidecars only.
--
-- Does not modify:
--   DigitalSettlementInstruction
--   InstitutionalInstrumentKind
--   PinLoginRequest
--   Treasury
--   existing instrument records
-- ============================================================================

-- CreateEnum
CREATE TYPE "InstrumentAuthorityClass" AS ENUM (
  'RESERVED',
  'JOINT',
  'DELEGATED',
  'PROHIBITED'
);

-- CreateEnum
CREATE TYPE "InstrumentEvidenceType" AS ENUM (
  'DOCUMENT',
  'ATTESTATION',
  'EXTERNAL_RECORD',
  'DIGITAL_PROOF',
  'COMMERCIAL_RECORD',
  'SETTLEMENT_PROOF',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "InstrumentEvidenceSubject" AS ENUM (
  'INSTRUMENT',
  'VERSION',
  'PROPOSITION',
  'AUTHORITY',
  'TRANSITION',
  'RELATION',
  'EXECUTION'
);

-- CreateEnum
CREATE TYPE "InstrumentRelationType" AS ENUM (
  'GOVERNS',
  'IMPLEMENTS',
  'DERIVES_FROM',
  'SUPERSEDES',
  'SUPPORTS',
  'SETTLES',
  'REFERENCES'
);

-- CreateTable
CREATE TABLE "InstrumentAuthority" (
  "id" TEXT NOT NULL,
  "instrumentId" TEXT NOT NULL,
  "authorityKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "authorityClass" "InstrumentAuthorityClass" NOT NULL,
  "holderPartyId" TEXT,
  "action" TEXT NOT NULL,
  "conditions" JSONB,
  "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InstrumentAuthority_pkey"
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentStateTransition" (
  "id" TEXT NOT NULL,
  "instrumentId" TEXT NOT NULL,
  "fromStatus" "InstitutionalInstrumentStatus",
  "toStatus" "InstitutionalInstrumentStatus" NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "authorityId" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstrumentStateTransition_pkey"
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentEvidence" (
  "id" TEXT NOT NULL,
  "instrumentId" TEXT NOT NULL,
  "evidenceType" "InstrumentEvidenceType" NOT NULL,
  "subjectType" "InstrumentEvidenceSubject" NOT NULL,
  "subjectId" TEXT,
  "title" TEXT NOT NULL,
  "uri" TEXT,
  "contentHash" TEXT,
  "metadata" JSONB,
  "recordedByUserId" TEXT NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstrumentEvidence_pkey"
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentRelation" (
  "id" TEXT NOT NULL,
  "sourceInstrumentId" TEXT NOT NULL,
  "targetInstrumentId" TEXT NOT NULL,
  "relationType" "InstrumentRelationType" NOT NULL,
  "label" TEXT,
  "metadata" JSONB,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstrumentRelation_pkey"
    PRIMARY KEY ("id")
);

-- InstrumentAuthority indexes
CREATE INDEX
  "InstrumentAuthority_instrumentId_authorityKey_idx"
ON "InstrumentAuthority"("instrumentId", "authorityKey");

CREATE INDEX
  "InstrumentAuthority_instrumentId_authorityClass_idx"
ON "InstrumentAuthority"("instrumentId", "authorityClass");

CREATE INDEX
  "InstrumentAuthority_holderPartyId_idx"
ON "InstrumentAuthority"("holderPartyId");

CREATE INDEX
  "InstrumentAuthority_revokedAt_idx"
ON "InstrumentAuthority"("revokedAt");

-- InstrumentStateTransition indexes
CREATE INDEX
  "InstrumentStateTransition_instrumentId_occurredAt_idx"
ON "InstrumentStateTransition"("instrumentId", "occurredAt");

CREATE INDEX
  "InstrumentStateTransition_instrumentId_toStatus_idx"
ON "InstrumentStateTransition"("instrumentId", "toStatus");

CREATE INDEX
  "InstrumentStateTransition_actorUserId_idx"
ON "InstrumentStateTransition"("actorUserId");

CREATE INDEX
  "InstrumentStateTransition_authorityId_idx"
ON "InstrumentStateTransition"("authorityId");

-- InstrumentEvidence indexes
CREATE INDEX
  "InstrumentEvidence_instrumentId_evidenceType_idx"
ON "InstrumentEvidence"("instrumentId", "evidenceType");

CREATE INDEX
  "InstrumentEvidence_instrumentId_subjectType_subjectId_idx"
ON "InstrumentEvidence"("instrumentId", "subjectType", "subjectId");

CREATE INDEX
  "InstrumentEvidence_contentHash_idx"
ON "InstrumentEvidence"("contentHash");

CREATE INDEX
  "InstrumentEvidence_recordedAt_idx"
ON "InstrumentEvidence"("recordedAt");

-- InstrumentRelation indexes
CREATE UNIQUE INDEX
  "InstrumentRelation_sourceInstrumentId_targetInstrumentId_re_key"
ON "InstrumentRelation"(
  "sourceInstrumentId",
  "targetInstrumentId",
  "relationType"
);

CREATE INDEX
  "InstrumentRelation_sourceInstrumentId_relationType_idx"
ON "InstrumentRelation"("sourceInstrumentId", "relationType");

CREATE INDEX
  "InstrumentRelation_targetInstrumentId_relationType_idx"
ON "InstrumentRelation"("targetInstrumentId", "relationType");

CREATE INDEX
  "InstrumentRelation_createdByUserId_idx"
ON "InstrumentRelation"("createdByUserId");

-- Foreign keys: InstrumentAuthority
ALTER TABLE "InstrumentAuthority"
ADD CONSTRAINT "InstrumentAuthority_instrumentId_fkey"
FOREIGN KEY ("instrumentId")
REFERENCES "InstitutionalInstrument"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "InstrumentAuthority"
ADD CONSTRAINT "InstrumentAuthority_holderPartyId_fkey"
FOREIGN KEY ("holderPartyId")
REFERENCES "InstrumentParty"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "InstrumentAuthority"
ADD CONSTRAINT "InstrumentAuthority_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Foreign keys: InstrumentStateTransition
ALTER TABLE "InstrumentStateTransition"
ADD CONSTRAINT "InstrumentStateTransition_instrumentId_fkey"
FOREIGN KEY ("instrumentId")
REFERENCES "InstitutionalInstrument"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "InstrumentStateTransition"
ADD CONSTRAINT "InstrumentStateTransition_actorUserId_fkey"
FOREIGN KEY ("actorUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "InstrumentStateTransition"
ADD CONSTRAINT "InstrumentStateTransition_authorityId_fkey"
FOREIGN KEY ("authorityId")
REFERENCES "InstrumentAuthority"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Foreign keys: InstrumentEvidence
ALTER TABLE "InstrumentEvidence"
ADD CONSTRAINT "InstrumentEvidence_instrumentId_fkey"
FOREIGN KEY ("instrumentId")
REFERENCES "InstitutionalInstrument"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "InstrumentEvidence"
ADD CONSTRAINT "InstrumentEvidence_recordedByUserId_fkey"
FOREIGN KEY ("recordedByUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Foreign keys: InstrumentRelation
ALTER TABLE "InstrumentRelation"
ADD CONSTRAINT "InstrumentRelation_sourceInstrumentId_fkey"
FOREIGN KEY ("sourceInstrumentId")
REFERENCES "InstitutionalInstrument"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "InstrumentRelation"
ADD CONSTRAINT "InstrumentRelation_targetInstrumentId_fkey"
FOREIGN KEY ("targetInstrumentId")
REFERENCES "InstitutionalInstrument"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "InstrumentRelation"
ADD CONSTRAINT "InstrumentRelation_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
