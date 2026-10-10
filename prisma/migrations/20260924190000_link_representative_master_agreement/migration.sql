-- An executed Master Agreement may be linked to a candidate intake.
-- This link grants no Program standing, appointment, or authority.

ALTER TYPE "InstitutionalInstrumentKind"
ADD VALUE IF NOT EXISTS 'REPRESENTATIVE_PROGRAM_AGREEMENT';

ALTER TABLE "RepresentativeOnboardingIntake"
ADD COLUMN "masterAgreementInstrumentId" TEXT;

CREATE UNIQUE INDEX
"RepresentativeOnboardingIntake_masterAgreementInstrumentId_key"
ON "RepresentativeOnboardingIntake"("masterAgreementInstrumentId");

ALTER TABLE "RepresentativeOnboardingIntake"
ADD CONSTRAINT "RepresentativeOnboardingIntake_masterAgreementInstrumentId_fkey"
FOREIGN KEY ("masterAgreementInstrumentId")
REFERENCES "InstitutionalInstrument"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
