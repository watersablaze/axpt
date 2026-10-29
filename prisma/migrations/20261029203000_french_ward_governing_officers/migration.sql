-- FW-BOARD-ID-1B
-- Durable French-Ward governing-officer identity.
--
-- Standing only.
-- Does not grant AXPT roles, permissions, commercial authority,
-- instrument authority, or institutional resource access.

CREATE TABLE "FrenchWardGoverningOfficer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "institutionalTitle" TEXT NOT NULL,
    "secondaryTitle" TEXT,
    "governingBasis" TEXT NOT NULL,
    "provenanceReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "recognizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrenchWardGoverningOfficer_pkey"
      PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FrenchWardGoverningOfficer_userId_key"
ON "FrenchWardGoverningOfficer"("userId");

CREATE UNIQUE INDEX "FrenchWardGoverningOfficer_reference_key"
ON "FrenchWardGoverningOfficer"("reference");

CREATE INDEX "FrenchWardGoverningOfficer_status_idx"
ON "FrenchWardGoverningOfficer"("status");

CREATE INDEX "FrenchWardGoverningOfficer_displayName_idx"
ON "FrenchWardGoverningOfficer"("displayName");

CREATE INDEX "FrenchWardGoverningOfficer_provenanceReference_idx"
ON "FrenchWardGoverningOfficer"("provenanceReference");

ALTER TABLE "FrenchWardGoverningOfficer"
ADD CONSTRAINT "FrenchWardGoverningOfficer_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
