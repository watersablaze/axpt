-- FW-GSAM-ARP-1B.1
-- Institutional participation metadata only.
-- No account, appointment, CUP or commercial authority created.

CREATE TABLE "GsamInstitutionalParticipation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "institutionLegalName" TEXT NOT NULL,
    "representativeName" TEXT NOT NULL,
    "representativeCapacity" TEXT NOT NULL,
    "governingBasis" TEXT NOT NULL,
    "programScope" TEXT NOT NULL,
    "custodialContext" TEXT,
    "documentationStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "accessStatus" TEXT NOT NULL DEFAULT 'NOT_PROVISIONED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GsamInstitutionalParticipation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GsamInstitutionalParticipation_reference_key"
ON "GsamInstitutionalParticipation"("reference");

CREATE INDEX "GsamInstitutionalParticipation_institutionLegalName_idx"
ON "GsamInstitutionalParticipation"("institutionLegalName");

CREATE INDEX "GsamInstitutionalParticipation_documentationStatus_idx"
ON "GsamInstitutionalParticipation"("documentationStatus");
