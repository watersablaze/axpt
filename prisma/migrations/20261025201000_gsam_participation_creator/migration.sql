-- FW-GSAM-ARP-1B.2A
-- Creator attribution for institutional registrations.
-- Existing records retain NULL until explicitly attributed.

ALTER TABLE "GsamInstitutionalParticipation"
ADD COLUMN "createdByUserId" TEXT;
