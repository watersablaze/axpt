-- CreateEnum
CREATE TYPE "SourceAuthorityAssertionClass" AS ENUM ('INSTITUTIONAL_IDENTITY', 'SOURCE_AUTHORITY', 'OPERATIONAL_CAPABILITY', 'COMMERCIAL_RELATIONSHIP', 'SOVEREIGN_CONTEXT', 'INSTRUMENT_BOUNDARY');

-- CreateEnum
CREATE TYPE "SourceAuthorityCapabilityKey" AS ENUM ('MINERAL_PRODUCTION_AGGREGATION', 'COMMODITY_PREPARATION_SOURCE_COORDINATION', 'COMMERCIAL_PREPARATION', 'EXPORT_LOGISTICS_COORDINATION', 'COUNTERPARTY_ENGAGEMENT', 'DOCUMENTARY_REGULATORY_SUPPORT');

-- CreateEnum
CREATE TYPE "SourceAuthorityRecognitionOutcome" AS ENUM ('RECOGNIZED', 'RECOGNIZED_WITH_LIMITATION', 'NOT_RECOGNIZED');

-- CreateEnum
CREATE TYPE "SourceAuthorityRecognitionCurrentSlot" AS ENUM ('CURRENT');

-- AlterEnum
ALTER TYPE "InstitutionalInstrumentKind" ADD VALUE 'SOURCE_AUTHORITY';

-- CreateTable
CREATE TABLE "SourceAuthorityRecord" (
    "id" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "subjectDisplayName" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "institutionalCapacity" TEXT NOT NULL,
    "operatingBase" TEXT,
    "sector" TEXT,
    "principalCommodityActivity" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceAuthorityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceAuthorityAssertion" (
    "id" TEXT NOT NULL,
    "sourceAuthorityId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "assertionClass" "SourceAuthorityAssertionClass" NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "scope" TEXT,
    "ordinal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceAuthorityAssertion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceAuthorityCapability" (
    "id" TEXT NOT NULL,
    "assertionId" TEXT NOT NULL,
    "capabilityKey" "SourceAuthorityCapabilityKey" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceAuthorityCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceAuthorityRecognition" (
    "id" TEXT NOT NULL,
    "assertionId" TEXT NOT NULL,
    "outcome" "SourceAuthorityRecognitionOutcome" NOT NULL,
    "limitation" TEXT,
    "reason" TEXT,
    "actorUserId" TEXT NOT NULL,
    "supersedesRecognitionId" TEXT,
    "currentSlot" "SourceAuthorityRecognitionCurrentSlot",
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceAuthorityRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceAuthorityRecognitionEvidence" (
    "recognitionId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceAuthorityRecognitionEvidence_pkey" PRIMARY KEY ("recognitionId","evidenceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceAuthorityRecord_instrumentId_key" ON "SourceAuthorityRecord"("instrumentId");

-- CreateIndex
CREATE INDEX "SourceAuthorityRecord_subjectDisplayName_idx" ON "SourceAuthorityRecord"("subjectDisplayName");

-- CreateIndex
CREATE INDEX "SourceAuthorityRecord_jurisdiction_idx" ON "SourceAuthorityRecord"("jurisdiction");

-- CreateIndex
CREATE INDEX "SourceAuthorityAssertion_sourceAuthorityId_assertionClass_idx" ON "SourceAuthorityAssertion"("sourceAuthorityId", "assertionClass");

-- CreateIndex
CREATE INDEX "SourceAuthorityAssertion_sourceAuthorityId_versionId_idx" ON "SourceAuthorityAssertion"("sourceAuthorityId", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceAuthorityAssertion_versionId_reference_key" ON "SourceAuthorityAssertion"("versionId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "SourceAuthorityAssertion_versionId_ordinal_key" ON "SourceAuthorityAssertion"("versionId", "ordinal");

-- CreateIndex
CREATE INDEX "SourceAuthorityCapability_capabilityKey_idx" ON "SourceAuthorityCapability"("capabilityKey");

-- CreateIndex
CREATE UNIQUE INDEX "SourceAuthorityCapability_assertionId_capabilityKey_key" ON "SourceAuthorityCapability"("assertionId", "capabilityKey");

-- CreateIndex
CREATE UNIQUE INDEX "SourceAuthorityRecognition_supersedesRecognitionId_key" ON "SourceAuthorityRecognition"("supersedesRecognitionId");

-- CreateIndex
CREATE INDEX "SourceAuthorityRecognition_assertionId_occurredAt_idx" ON "SourceAuthorityRecognition"("assertionId", "occurredAt");

-- CreateIndex
CREATE INDEX "SourceAuthorityRecognition_actorUserId_occurredAt_idx" ON "SourceAuthorityRecognition"("actorUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "SourceAuthorityRecognition_outcome_idx" ON "SourceAuthorityRecognition"("outcome");

-- CreateIndex
CREATE UNIQUE INDEX "SourceAuthorityRecognition_assertionId_currentSlot_key" ON "SourceAuthorityRecognition"("assertionId", "currentSlot");

-- CreateIndex
CREATE INDEX "SourceAuthorityRecognitionEvidence_evidenceId_idx" ON "SourceAuthorityRecognitionEvidence"("evidenceId");

-- AddForeignKey
ALTER TABLE "SourceAuthorityRecord" ADD CONSTRAINT "SourceAuthorityRecord_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "InstitutionalInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceAuthorityAssertion" ADD CONSTRAINT "SourceAuthorityAssertion_sourceAuthorityId_fkey" FOREIGN KEY ("sourceAuthorityId") REFERENCES "SourceAuthorityRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceAuthorityAssertion" ADD CONSTRAINT "SourceAuthorityAssertion_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "InstrumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceAuthorityCapability" ADD CONSTRAINT "SourceAuthorityCapability_assertionId_fkey" FOREIGN KEY ("assertionId") REFERENCES "SourceAuthorityAssertion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceAuthorityRecognition" ADD CONSTRAINT "SourceAuthorityRecognition_assertionId_fkey" FOREIGN KEY ("assertionId") REFERENCES "SourceAuthorityAssertion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceAuthorityRecognition" ADD CONSTRAINT "SourceAuthorityRecognition_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceAuthorityRecognition" ADD CONSTRAINT "SourceAuthorityRecognition_supersedesRecognitionId_fkey" FOREIGN KEY ("supersedesRecognitionId") REFERENCES "SourceAuthorityRecognition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceAuthorityRecognitionEvidence" ADD CONSTRAINT "SourceAuthorityRecognitionEvidence_recognitionId_fkey" FOREIGN KEY ("recognitionId") REFERENCES "SourceAuthorityRecognition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceAuthorityRecognitionEvidence" ADD CONSTRAINT "SourceAuthorityRecognitionEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "InstrumentEvidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Source Authority evidence-admission concurrency claim.
--
-- Generic InstrumentEvidence remains append-oriented.
-- This claim owns idempotency / concurrent first-admission
-- semantics only within the Source Authority aggregate.
CREATE TABLE "SourceAuthorityEvidenceAdmission" (
    "id" TEXT NOT NULL,
    "sourceAuthorityId" TEXT NOT NULL,
    "evidenceRole" TEXT NOT NULL,
    "admissionKey" TEXT NOT NULL,
    "evidenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceAuthorityEvidenceAdmission_pkey"
        PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
    "SourceAuthorityEvidenceAdmission_evidenceId_key"
ON
    "SourceAuthorityEvidenceAdmission"("evidenceId");

CREATE UNIQUE INDEX
    "SourceAuthorityEvidenceAdmission_sourceAuthorityId_evidence_key"
ON
    "SourceAuthorityEvidenceAdmission"(
        "sourceAuthorityId",
        "evidenceRole"
    );

CREATE INDEX
    "SourceAuthorityEvidenceAdmission_sourceAuthorityId_admissio_idx"
ON
    "SourceAuthorityEvidenceAdmission"(
        "sourceAuthorityId",
        "admissionKey"
    );

CREATE INDEX
    "SourceAuthorityEvidenceAdmission_sourceAuthorityId_createdA_idx"
ON
    "SourceAuthorityEvidenceAdmission"(
        "sourceAuthorityId",
        "createdAt"
    );

ALTER TABLE
    "SourceAuthorityEvidenceAdmission"
ADD CONSTRAINT
    "SourceAuthorityEvidenceAdmission_sourceAuthorityId_fkey"
FOREIGN KEY
    ("sourceAuthorityId")
REFERENCES
    "SourceAuthorityRecord"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE
    "SourceAuthorityEvidenceAdmission"
ADD CONSTRAINT
    "SourceAuthorityEvidenceAdmission_evidenceId_fkey"
FOREIGN KEY
    ("evidenceId")
REFERENCES
    "InstrumentEvidence"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
