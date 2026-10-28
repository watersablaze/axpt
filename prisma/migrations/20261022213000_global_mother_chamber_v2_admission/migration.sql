-- GM-V2.1B.1
-- Additive structure only; no backfill, room creation or admissions.

CREATE TABLE "GlobalMotherChamberAdmission" (
  "id" TEXT NOT NULL,
  "instrumentReference" TEXT NOT NULL,
  "cycleLabel" TEXT NOT NULL,
  "participantKey" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "capacity" TEXT NOT NULL,
  "participantUserId" TEXT,
  "capacityEvidenceReference" TEXT,
  "capacityVerifiedByUserId" TEXT,
  "capacityVerifiedAt" TIMESTAMP(3),
  "standing" TEXT NOT NULL DEFAULT 'PREPARED',
  "admittedByUserId" TEXT,
  "admittedAt" TIMESTAMP(3),
  "decisionReason" TEXT,
  "revokedByUserId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "revocationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GlobalMotherChamberAdmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GMChamberAdmission_standing_check"
    CHECK ("standing" IN ('PREPARED', 'ADMITTED', 'REVOKED'))
);

CREATE UNIQUE INDEX "GMChamberAdmission_cycle_participant_key"
  ON "GlobalMotherChamberAdmission"
  ("instrumentReference", "cycleLabel", "participantKey");

CREATE INDEX "GMChamberAdmission_participant_standing_idx"
  ON "GlobalMotherChamberAdmission"
  ("participantUserId", "standing");

CREATE INDEX "GMChamberAdmission_standing_revoked_idx"
  ON "GlobalMotherChamberAdmission"
  ("standing", "revokedAt");

ALTER TABLE "GlobalMotherChamberAdmission"
  ADD CONSTRAINT "GMChamberAdmission_participant_fk"
    FOREIGN KEY ("participantUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "GMChamberAdmission_verifier_fk"
    FOREIGN KEY ("capacityVerifiedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "GMChamberAdmission_decider_fk"
    FOREIGN KEY ("admittedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "GMChamberAdmission_revoker_fk"
    FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "GlobalMotherChamberRoomBinding" (
  "id" TEXT NOT NULL,
  "instrumentReference" TEXT NOT NULL,
  "cycleLabel" TEXT NOT NULL,
  "operationalRoomId" TEXT,
  "standing" TEXT NOT NULL DEFAULT 'PREPARED',
  "boundByUserId" TEXT,
  "boundAt" TIMESTAMP(3),
  "bindingReason" TEXT,
  "revokedByUserId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "revocationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GlobalMotherChamberRoomBinding_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GMChamberRoomBinding_standing_check"
    CHECK ("standing" IN ('PREPARED', 'BOUND', 'REVOKED'))
);

CREATE UNIQUE INDEX "GMChamberRoomBinding_cycle_key"
  ON "GlobalMotherChamberRoomBinding"
  ("instrumentReference", "cycleLabel");

CREATE UNIQUE INDEX "GMChamberRoomBinding_room_key"
  ON "GlobalMotherChamberRoomBinding" ("operationalRoomId");

CREATE INDEX "GMChamberRoomBinding_standing_revoked_idx"
  ON "GlobalMotherChamberRoomBinding" ("standing", "revokedAt");

ALTER TABLE "GlobalMotherChamberRoomBinding"
  ADD CONSTRAINT "GMChamberRoomBinding_room_fk"
    FOREIGN KEY ("operationalRoomId")
    REFERENCES "CommunicationOperationalRoom"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "GMChamberRoomBinding_binder_fk"
    FOREIGN KEY ("boundByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "GMChamberRoomBinding_revoker_fk"
    FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;


-- GM-V2.1B.1A: standing completeness
-- These constraints do not authorize admission or binding.
-- They prevent incomplete positive and revoked states.

ALTER TABLE "GlobalMotherChamberAdmission"
  ADD CONSTRAINT "GMChamberAdmission_admitted_complete_check"
  CHECK (
    "standing" NOT IN ('ADMITTED', 'REVOKED')
    OR (
      "participantUserId" IS NOT NULL
      AND NULLIF(BTRIM("capacityEvidenceReference"), '') IS NOT NULL
      AND "capacityVerifiedByUserId" IS NOT NULL
      AND "capacityVerifiedAt" IS NOT NULL
      AND "admittedByUserId" IS NOT NULL
      AND "admittedAt" IS NOT NULL
      AND NULLIF(BTRIM("decisionReason"), '') IS NOT NULL
    )
  );

ALTER TABLE "GlobalMotherChamberAdmission"
  ADD CONSTRAINT "GMChamberAdmission_revocation_complete_check"
  CHECK (
    (
      "standing" = 'REVOKED'
      AND "revokedAt" IS NOT NULL
      AND "revokedByUserId" IS NOT NULL
      AND NULLIF(BTRIM("revocationReason"), '') IS NOT NULL
    )
    OR (
      "standing" <> 'REVOKED'
      AND "revokedAt" IS NULL
      AND "revokedByUserId" IS NULL
      AND "revocationReason" IS NULL
    )
  );

ALTER TABLE "GlobalMotherChamberRoomBinding"
  ADD CONSTRAINT "GMChamberRoomBinding_bound_complete_check"
  CHECK (
    "standing" NOT IN ('BOUND', 'REVOKED')
    OR (
      "operationalRoomId" IS NOT NULL
      AND "boundByUserId" IS NOT NULL
      AND "boundAt" IS NOT NULL
      AND NULLIF(BTRIM("bindingReason"), '') IS NOT NULL
    )
  );

ALTER TABLE "GlobalMotherChamberRoomBinding"
  ADD CONSTRAINT "GMChamberRoomBinding_revocation_complete_check"
  CHECK (
    (
      "standing" = 'REVOKED'
      AND "revokedAt" IS NOT NULL
      AND "revokedByUserId" IS NOT NULL
      AND NULLIF(BTRIM("revocationReason"), '') IS NOT NULL
    )
    OR (
      "standing" <> 'REVOKED'
      AND "revokedAt" IS NULL
      AND "revokedByUserId" IS NULL
      AND "revocationReason" IS NULL
    )
  );
