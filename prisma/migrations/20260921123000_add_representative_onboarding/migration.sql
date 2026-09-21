-- French-Ward Authorized Representation Program
-- Durable candidate onboarding layer.
--
-- CANDIDATE ≠ PARTICIPANT
-- SUBMISSION ≠ QUALIFICATION
-- QUALIFICATION ≠ ADMISSION
-- ADMISSION ≠ APPOINTMENT
--
-- This migration creates candidate onboarding persistence and
-- lifecycle history without consuming a Program docket.

CREATE TYPE "RepresentativeOnboardingStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'QUALIFIED',
  'RETURNED_FOR_COMPLETION',
  'DECLINED',
  'ADMITTED'
);

CREATE TYPE "RepresentativeQualificationDecision" AS ENUM (
  'PENDING',
  'QUALIFIED',
  'RETURN_FOR_COMPLETION',
  'DECLINED'
);

CREATE TABLE "RepresentativeOnboardingIntake" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,

  "status" "RepresentativeOnboardingStatus"
    NOT NULL DEFAULT 'DRAFT',

  "qualificationDecision" "RepresentativeQualificationDecision"
    NOT NULL DEFAULT 'PENDING',

  "candidateDisplayName" TEXT NOT NULL,
  "candidateEmail" TEXT NOT NULL,
  "submission" JSONB,

  "internalNotes" TEXT,

  "accessTokenHash" TEXT,
  "accessIssuedAt" TIMESTAMP(3),
  "accessExpiresAt" TIMESTAMP(3),
  "accessRevokedAt" TIMESTAMP(3),

  "submittedAt" TIMESTAMP(3),
  "reviewStartedAt" TIMESTAMP(3),
  "qualifiedAt" TIMESTAMP(3),
  "admittedAt" TIMESTAMP(3),

  "admittedParticipantId" TEXT,
  "createdByUserId" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RepresentativeOnboardingIntake_pkey"
  PRIMARY KEY ("id")
);

CREATE TABLE "RepresentativeOnboardingTransition" (
  "id" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,

  "fromStatus" "RepresentativeOnboardingStatus",
  "toStatus" "RepresentativeOnboardingStatus" NOT NULL,

  "actorUserId" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RepresentativeOnboardingTransition_pkey"
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"RepresentativeOnboardingIntake_reference_key"
ON "RepresentativeOnboardingIntake"("reference");

CREATE UNIQUE INDEX
"RepresentativeOnboardingIntake_accessTokenHash_key"
ON "RepresentativeOnboardingIntake"("accessTokenHash");

CREATE UNIQUE INDEX
"RepresentativeOnboardingIntake_admittedParticipantId_key"
ON "RepresentativeOnboardingIntake"("admittedParticipantId");

CREATE INDEX
"RepresentativeOnboardingIntake_status_idx"
ON "RepresentativeOnboardingIntake"("status");

CREATE INDEX
"RepresentativeOnboardingIntake_qualificationDecision_idx"
ON "RepresentativeOnboardingIntake"("qualificationDecision");

CREATE INDEX
"RepresentativeOnboardingIntake_candidateEmail_idx"
ON "RepresentativeOnboardingIntake"("candidateEmail");

CREATE INDEX
"RepresentativeOnboardingIntake_createdByUserId_idx"
ON "RepresentativeOnboardingIntake"("createdByUserId");

CREATE INDEX
"RepresentativeOnboardingIntake_createdAt_idx"
ON "RepresentativeOnboardingIntake"("createdAt");

CREATE INDEX
"RepresentativeOnboardingTransition_intakeId_occurredAt_idx"
ON "RepresentativeOnboardingTransition"("intakeId", "occurredAt");

CREATE INDEX
"RepresentativeOnboardingTransition_intakeId_toStatus_idx"
ON "RepresentativeOnboardingTransition"("intakeId", "toStatus");

CREATE INDEX
"RepresentativeOnboardingTransition_actorUserId_idx"
ON "RepresentativeOnboardingTransition"("actorUserId");

ALTER TABLE "RepresentativeOnboardingIntake"
ADD CONSTRAINT "RepresentativeOnboardingIntake_admittedParticipantId_fkey"
FOREIGN KEY ("admittedParticipantId")
REFERENCES "RepresentativeProgramParticipant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeOnboardingIntake"
ADD CONSTRAINT "RepresentativeOnboardingIntake_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeOnboardingTransition"
ADD CONSTRAINT "RepresentativeOnboardingTransition_intakeId_fkey"
FOREIGN KEY ("intakeId")
REFERENCES "RepresentativeOnboardingIntake"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "RepresentativeOnboardingTransition"
ADD CONSTRAINT "RepresentativeOnboardingTransition_actorUserId_fkey"
FOREIGN KEY ("actorUserId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
