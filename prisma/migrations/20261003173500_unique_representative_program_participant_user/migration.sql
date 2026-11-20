-- REP-1B.1
-- One canonical AXPT User may be linked to at most one
-- Representative Program Participant.
--
-- PostgreSQL UNIQUE permits multiple NULL values, so unlinked
-- participants remain valid until institutional identity linkage occurs.

DROP INDEX IF EXISTS "RepresentativeProgramParticipant_userId_idx";

CREATE UNIQUE INDEX
  "RepresentativeProgramParticipant_userId_key"
ON
  "RepresentativeProgramParticipant"("userId");
