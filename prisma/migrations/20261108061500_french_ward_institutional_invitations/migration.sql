-- French-Ward institutional participant invitation foundation.
--
-- Invitation is controlled institutional admission intent only.
-- It grants no AXPT role, governing standing, commercial authority,
-- instrument authority, or institutional resource access.
--
-- Raw bearer credential material is never persisted.

CREATE TABLE "FrenchWardInstitutionalInvitation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,

    "recipientEmail" TEXT NOT NULL,
    "recipientDisplayName" TEXT NOT NULL,

    "participantReference" TEXT NOT NULL,

    "institutionalTitle" TEXT NOT NULL,
    "secondaryTitle" TEXT,
    "capacityClass" "FrenchWardInstitutionalCapacityClass" NOT NULL,

    "recognitionBasis" TEXT NOT NULL,
    "provenanceReference" TEXT,

    "credentialHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "acceptedByUserId" TEXT,
    "acceptedAt" TIMESTAMP(3),

    "revokedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrenchWardInstitutionalInvitation_pkey"
      PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
  "FrenchWardInstitutionalInvitation_reference_key"
ON "FrenchWardInstitutionalInvitation"("reference");

CREATE UNIQUE INDEX
  "FrenchWardInstitutionalInvitation_credentialHash_key"
ON "FrenchWardInstitutionalInvitation"("credentialHash");

CREATE INDEX
  "FrenchWardInstitutionalInvitation_recipientEmail_expiresAt_idx"
ON "FrenchWardInstitutionalInvitation"("recipientEmail", "expiresAt");

CREATE INDEX
  "FrenchWardInstitutionalInvitation_participantReference_issuedAt_idx"
ON "FrenchWardInstitutionalInvitation"("participantReference", "issuedAt");

CREATE INDEX
  "FrenchWardInstitutionalInvitation_issuedByUserId_issuedAt_idx"
ON "FrenchWardInstitutionalInvitation"("issuedByUserId", "issuedAt");

CREATE INDEX
  "FrenchWardInstitutionalInvitation_acceptedByUserId_acceptedAt_idx"
ON "FrenchWardInstitutionalInvitation"("acceptedByUserId", "acceptedAt");

CREATE INDEX
  "FrenchWardInstitutionalInvitation_revokedAt_expiresAt_idx"
ON "FrenchWardInstitutionalInvitation"("revokedAt", "expiresAt");

ALTER TABLE "FrenchWardInstitutionalInvitation"
ADD CONSTRAINT
  "FrenchWardInstitutionalInvitation_issuedByUserId_fkey"
FOREIGN KEY ("issuedByUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "FrenchWardInstitutionalInvitation"
ADD CONSTRAINT
  "FrenchWardInstitutionalInvitation_acceptedByUserId_fkey"
FOREIGN KEY ("acceptedByUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "FrenchWardInstitutionalInvitation"
ADD CONSTRAINT
  "FrenchWardInstitutionalInvitation_revokedByUserId_fkey"
FOREIGN KEY ("revokedByUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

COMMENT ON TABLE "FrenchWardInstitutionalInvitation" IS
'Controlled French-Ward institutional participation invitation. Invitation alone grants no role, governing standing, commercial authority, instrument authority, or resource access.';
