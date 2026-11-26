CREATE TABLE "ExternalTransactionIntakeAdoption" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "canonicalPrincipalReference" TEXT NOT NULL,
    "externalRegistrationEventId" TEXT NOT NULL,
    "issuerUserId" TEXT NOT NULL,
    "governingReference" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "decisionFingerprint" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalTransactionIntakeAdoption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExternalTransactionIntakeAdoption_intakeId_key"
ON "ExternalTransactionIntakeAdoption"("intakeId");

CREATE INDEX "ExternalTransactionIntakeAdoption_matterId_idx"
ON "ExternalTransactionIntakeAdoption"("matterId");

ALTER TABLE "ExternalTransactionIntakeAdoption"
ADD CONSTRAINT "ExternalTransactionIntakeAdoption_intakeId_fkey"
FOREIGN KEY ("intakeId") REFERENCES "TransactionIntake"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExternalTransactionIntakeAdoption"
ADD CONSTRAINT "ExternalTransactionIntakeAdoption_matterId_fkey"
FOREIGN KEY ("matterId") REFERENCES "InstitutionalMatter"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TYPE "InstitutionalMatterEventType" ADD VALUE 'EXTERNAL_INTAKE_ADOPTED';

ALTER TABLE "InstitutionalMatterRecord"
ADD COLUMN "canonicalPrincipalReference" TEXT,
ADD COLUMN "canonicalBindingEvidenceReference" TEXT;

ALTER TABLE "InstitutionalMatterRecord"
ADD CONSTRAINT "InstitutionalMatterRecord_canonical_intake_binding_check"
CHECK (
  ("canonicalPrincipalReference" IS NULL AND "canonicalBindingEvidenceReference" IS NULL)
  OR (
    "recordKind" = 'INTAKE'
    AND "canonicalPrincipalReference" IS NOT NULL
    AND "canonicalBindingEvidenceReference" IS NOT NULL
    AND length(btrim("canonicalPrincipalReference")) > 0
    AND length(btrim("canonicalBindingEvidenceReference")) > 0
  )
);
