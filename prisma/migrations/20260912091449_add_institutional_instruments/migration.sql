-- CreateEnum
CREATE TYPE "InstitutionalInstrumentKind" AS ENUM ('ROYAL_CUSTODIAL_FRAMEWORK', 'REPRESENTATIVE_MANDATE', 'LETTER_OF_INTENT', 'COOPERATION_FRAMEWORK', 'GENERAL');

-- CreateEnum
CREATE TYPE "InstitutionalInstrumentStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'ISSUED', 'ACCESSED', 'UNDER_DELIBERATION', 'CLARIFICATION_OPEN', 'REVISION_PENDING', 'PRINCIPLES_ALIGNED', 'DEFINITIVE_INSTRUMENT_PENDING', 'EXECUTION_PENDING', 'EXECUTED', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InstrumentVersionStatus" AS ENUM ('DRAFT', 'ISSUED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InstrumentPropositionState" AS ENUM ('CONFIRMED', 'UNDERSTOOD', 'PROPOSED', 'OPEN', 'REVISED', 'DECLINED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "InstrumentResponseType" AS ENUM ('ACKNOWLEDGE', 'AFFIRM', 'CLARIFY', 'REVISE', 'DECLINE');

-- CreateEnum
CREATE TYPE "InstrumentPartyRole" AS ENUM ('PRINCIPAL', 'CUSTODIAN', 'DELIBERATOR', 'REVIEWER', 'OBSERVER', 'COMMERCIAL_PARTICIPANT');

-- CreateEnum
CREATE TYPE "InstrumentAccessLevel" AS ENUM ('VIEW', 'RESPOND', 'DELIBERATE', 'ADMINISTER');

-- CreateTable
CREATE TABLE "InstitutionalInstrument" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" "InstitutionalInstrumentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "InstitutionalInstrumentStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionalInstrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentVersion" (
    "id" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "InstrumentVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstrumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentProposition" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "state" "InstrumentPropositionState" NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstrumentProposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentResponse" (
    "id" TEXT NOT NULL,
    "propositionId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "responseType" "InstrumentResponseType" NOT NULL,
    "note" TEXT,
    "supersedesResponseId" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstrumentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentParty" (
    "id" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "role" "InstrumentPartyRole" NOT NULL,
    "authorityClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstrumentParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstrumentAccessGrant" (
    "id" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "recipientName" TEXT,
    "recipientRole" "InstrumentPartyRole" NOT NULL,
    "accessLevel" "InstrumentAccessLevel" NOT NULL,
    "codeHash" TEXT,
    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "firstAccessAt" TIMESTAMP(3),
    "lastAccessAt" TIMESTAMP(3),

    CONSTRAINT "InstrumentAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalInstrument_reference_key" ON "InstitutionalInstrument"("reference");

-- CreateIndex
CREATE INDEX "InstitutionalInstrument_kind_idx" ON "InstitutionalInstrument"("kind");

-- CreateIndex
CREATE INDEX "InstitutionalInstrument_status_idx" ON "InstitutionalInstrument"("status");

-- CreateIndex
CREATE INDEX "InstitutionalInstrument_createdByUserId_idx" ON "InstitutionalInstrument"("createdByUserId");

-- CreateIndex
CREATE INDEX "InstitutionalInstrument_updatedAt_idx" ON "InstitutionalInstrument"("updatedAt");

-- CreateIndex
CREATE INDEX "InstrumentVersion_instrumentId_status_idx" ON "InstrumentVersion"("instrumentId", "status");

-- CreateIndex
CREATE INDEX "InstrumentVersion_createdByUserId_idx" ON "InstrumentVersion"("createdByUserId");

-- CreateIndex
CREATE INDEX "InstrumentVersion_issuedAt_idx" ON "InstrumentVersion"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentVersion_instrumentId_number_key" ON "InstrumentVersion"("instrumentId", "number");

-- CreateIndex
CREATE INDEX "InstrumentProposition_versionId_state_idx" ON "InstrumentProposition"("versionId", "state");

-- CreateIndex
CREATE INDEX "InstrumentProposition_domain_idx" ON "InstrumentProposition"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentProposition_versionId_reference_key" ON "InstrumentProposition"("versionId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentProposition_versionId_ordinal_key" ON "InstrumentProposition"("versionId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentResponse_supersedesResponseId_key" ON "InstrumentResponse"("supersedesResponseId");

-- CreateIndex
CREATE INDEX "InstrumentResponse_propositionId_actorUserId_createdAt_idx" ON "InstrumentResponse"("propositionId", "actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "InstrumentResponse_actorUserId_createdAt_idx" ON "InstrumentResponse"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "InstrumentResponse_responseType_idx" ON "InstrumentResponse"("responseType");

-- CreateIndex
CREATE INDEX "InstrumentParty_instrumentId_role_idx" ON "InstrumentParty"("instrumentId", "role");

-- CreateIndex
CREATE INDEX "InstrumentParty_userId_idx" ON "InstrumentParty"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentAccessGrant_codeHash_key" ON "InstrumentAccessGrant"("codeHash");

-- CreateIndex
CREATE INDEX "InstrumentAccessGrant_instrumentId_accessLevel_idx" ON "InstrumentAccessGrant"("instrumentId", "accessLevel");

-- CreateIndex
CREATE INDEX "InstrumentAccessGrant_recipientUserId_idx" ON "InstrumentAccessGrant"("recipientUserId");

-- CreateIndex
CREATE INDEX "InstrumentAccessGrant_issuedByUserId_idx" ON "InstrumentAccessGrant"("issuedByUserId");

-- CreateIndex
CREATE INDEX "InstrumentAccessGrant_expiresAt_idx" ON "InstrumentAccessGrant"("expiresAt");

-- CreateIndex
CREATE INDEX "InstrumentAccessGrant_revokedAt_idx" ON "InstrumentAccessGrant"("revokedAt");

-- AddForeignKey
ALTER TABLE "InstitutionalInstrument" ADD CONSTRAINT "InstitutionalInstrument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentVersion" ADD CONSTRAINT "InstrumentVersion_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "InstitutionalInstrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentVersion" ADD CONSTRAINT "InstrumentVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentProposition" ADD CONSTRAINT "InstrumentProposition_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "InstrumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentResponse" ADD CONSTRAINT "InstrumentResponse_propositionId_fkey" FOREIGN KEY ("propositionId") REFERENCES "InstrumentProposition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentResponse" ADD CONSTRAINT "InstrumentResponse_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentResponse" ADD CONSTRAINT "InstrumentResponse_supersedesResponseId_fkey" FOREIGN KEY ("supersedesResponseId") REFERENCES "InstrumentResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentParty" ADD CONSTRAINT "InstrumentParty_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "InstitutionalInstrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentParty" ADD CONSTRAINT "InstrumentParty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentAccessGrant" ADD CONSTRAINT "InstrumentAccessGrant_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "InstitutionalInstrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentAccessGrant" ADD CONSTRAINT "InstrumentAccessGrant_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstrumentAccessGrant" ADD CONSTRAINT "InstrumentAccessGrant_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
