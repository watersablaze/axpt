-- FW-FOUNDING-INVITE-1B.1
-- Durable French-Ward institutional participant recognition.
--
-- Recognition only.
-- Does not grant AXPT roles, governing standing, commercial authority,
-- instrument authority, or institutional resource access.

CREATE TYPE "FrenchWardInstitutionalCapacityClass"
AS ENUM (
  'STRATEGIC',
  'OPERATIONS',
  'FIDUCIARY'
);

CREATE TABLE "FrenchWardInstitutionalParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "institutionalTitle" TEXT NOT NULL,
    "secondaryTitle" TEXT,
    "capacityClass" "FrenchWardInstitutionalCapacityClass" NOT NULL,
    "recognitionBasis" TEXT NOT NULL,
    "provenanceReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "recognizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrenchWardInstitutionalParticipant_pkey"
      PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"FrenchWardInstitutionalParticipant_userId_key"
ON "FrenchWardInstitutionalParticipant"("userId");

CREATE UNIQUE INDEX
"FrenchWardInstitutionalParticipant_reference_key"
ON "FrenchWardInstitutionalParticipant"("reference");

CREATE INDEX
"FrenchWardInstitutionalParticipant_status_idx"
ON "FrenchWardInstitutionalParticipant"("status");

CREATE INDEX
"FrenchWardInstitutionalParticipant_capacityClass_status_idx"
ON "FrenchWardInstitutionalParticipant"("capacityClass", "status");

CREATE INDEX
"FrenchWardInstitutionalParticipant_displayName_idx"
ON "FrenchWardInstitutionalParticipant"("displayName");

CREATE INDEX
"FrenchWardInstitutionalParticipant_provenanceReference_idx"
ON "FrenchWardInstitutionalParticipant"("provenanceReference");

ALTER TABLE "FrenchWardInstitutionalParticipant"
ADD CONSTRAINT
"FrenchWardInstitutionalParticipant_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
