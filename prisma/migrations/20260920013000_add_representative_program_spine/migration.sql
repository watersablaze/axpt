-- Authorized Representation Program participant spine.
-- Program Standing remains distinct from InstitutionalInstrumentStatus.
-- Appointment Class remains distinct from InstrumentAuthority.

ALTER TYPE "InstitutionalInstrumentKind"
ADD VALUE IF NOT EXISTS 'REPRESENTATIVE_APPOINTMENT';

CREATE TYPE "RepresentativeAppointmentClass" AS ENUM (
  'REGISTERED_COMMERCIAL_INTRODUCER',
  'AUTHORIZED_COMMERCIAL_REPRESENTATIVE',
  'TRANSACTION_REPRESENTATIVE',
  'COMMERCIAL_MANDATE'
);

CREATE TYPE "RepresentativeProgramStanding" AS ENUM (
  'PROVISIONAL',
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'EXPIRED',
  'WITHDRAWN',
  'REVOKED'
);

CREATE TABLE "RepresentativeProgramDocketSequence" (
  "year" INTEGER NOT NULL,
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RepresentativeProgramDocketSequence_pkey"
  PRIMARY KEY ("year")
);

CREATE TABLE "RepresentativeProgramParticipant" (
  "id" TEXT NOT NULL,
  "docketReference" TEXT NOT NULL,
  "userId" TEXT,
  "displayName" TEXT NOT NULL,
  "standing" "RepresentativeProgramStanding" NOT NULL,
  "admittedAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RepresentativeProgramParticipant_pkey"
  PRIMARY KEY ("id")
);

CREATE TABLE "RepresentativeProgramAppointment" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "instrumentId" TEXT NOT NULL,
  "instrumentPartyId" TEXT NOT NULL,
  "appointmentClass" "RepresentativeAppointmentClass" NOT NULL,
  "scope" JSONB,
  "effectiveAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RepresentativeProgramAppointment_pkey"
  PRIMARY KEY ("id")
);

CREATE TABLE "RepresentativeProgramStandingTransition" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "fromStanding" "RepresentativeProgramStanding",
  "toStanding" "RepresentativeProgramStanding" NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RepresentativeProgramStandingTransition_pkey"
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"RepresentativeProgramParticipant_docketReference_key"
ON "RepresentativeProgramParticipant"("docketReference");

CREATE INDEX
"RepresentativeProgramParticipant_userId_idx"
ON "RepresentativeProgramParticipant"("userId");

CREATE INDEX
"RepresentativeProgramParticipant_standing_idx"
ON "RepresentativeProgramParticipant"("standing");

CREATE INDEX
"RepresentativeProgramParticipant_createdByUserId_idx"
ON "RepresentativeProgramParticipant"("createdByUserId");

CREATE UNIQUE INDEX
"RepresentativeProgramAppointment_instrumentId_key"
ON "RepresentativeProgramAppointment"("instrumentId");

CREATE UNIQUE INDEX
"RepresentativeProgramAppointment_instrumentPartyId_key"
ON "RepresentativeProgramAppointment"("instrumentPartyId");

CREATE INDEX
"RepresentativeProgramAppointment_participantId_idx"
ON "RepresentativeProgramAppointment"("participantId");

CREATE INDEX
"RepresentativeProgramAppointment_appointmentClass_idx"
ON "RepresentativeProgramAppointment"("appointmentClass");

CREATE INDEX
"RepresentativeProgramAppointment_effectiveAt_idx"
ON "RepresentativeProgramAppointment"("effectiveAt");

CREATE INDEX
"RepresentativeProgramAppointment_expiresAt_idx"
ON "RepresentativeProgramAppointment"("expiresAt");

CREATE INDEX
"RepresentativeProgramAppointment_endedAt_idx"
ON "RepresentativeProgramAppointment"("endedAt");

CREATE INDEX
"RepresentativeProgramStandingTransition_participantId_occurredAt_idx"
ON "RepresentativeProgramStandingTransition"("participantId", "occurredAt");

CREATE INDEX
"RepresentativeProgramStandingTransition_participantId_toStanding_idx"
ON "RepresentativeProgramStandingTransition"("participantId", "toStanding");

CREATE INDEX
"RepresentativeProgramStandingTransition_actorUserId_idx"
ON "RepresentativeProgramStandingTransition"("actorUserId");

ALTER TABLE "RepresentativeProgramParticipant"
ADD CONSTRAINT "RepresentativeProgramParticipant_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeProgramParticipant"
ADD CONSTRAINT "RepresentativeProgramParticipant_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeProgramAppointment"
ADD CONSTRAINT "RepresentativeProgramAppointment_participantId_fkey"
FOREIGN KEY ("participantId")
REFERENCES "RepresentativeProgramParticipant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeProgramAppointment"
ADD CONSTRAINT "RepresentativeProgramAppointment_instrumentId_fkey"
FOREIGN KEY ("instrumentId")
REFERENCES "InstitutionalInstrument"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeProgramAppointment"
ADD CONSTRAINT "RepresentativeProgramAppointment_instrumentPartyId_fkey"
FOREIGN KEY ("instrumentPartyId")
REFERENCES "InstrumentParty"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeProgramAppointment"
ADD CONSTRAINT "RepresentativeProgramAppointment_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeProgramStandingTransition"
ADD CONSTRAINT "RepresentativeProgramStandingTransition_participantId_fkey"
FOREIGN KEY ("participantId")
REFERENCES "RepresentativeProgramParticipant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeProgramStandingTransition"
ADD CONSTRAINT "RepresentativeProgramStandingTransition_actorUserId_fkey"
FOREIGN KEY ("actorUserId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
