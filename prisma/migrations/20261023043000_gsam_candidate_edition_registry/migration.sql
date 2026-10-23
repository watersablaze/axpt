-- GSAM-3L3B1: candidate-only record foundation. DO NOT APPLY TO SHARED OR PRODUCTION DB.
-- No issuance capability, no recipient grants, no storage upload in this migration.
CREATE TABLE "GsamScoEdition" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "quantityMt" INTEGER NOT NULL,
  "sourceSha256" TEXT NOT NULL,
  "pdfSha256" TEXT NOT NULL,
  "htmlSha256" TEXT NOT NULL,
  "pdfStorageKey" TEXT,
  "htmlStorageKey" TEXT,
  "state" TEXT NOT NULL DEFAULT 'CANDIDATE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GsamScoEdition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GsamScoEdition_candidate_only" CHECK ("state" = 'CANDIDATE'),
  CONSTRAINT "GsamScoEdition_quantity" CHECK ("quantityMt" IN (100, 1000)),
  CONSTRAINT "GsamScoEdition_source_hash" CHECK ("sourceSha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "GsamScoEdition_pdf_hash" CHECK ("pdfSha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "GsamScoEdition_html_hash" CHECK ("htmlSha256" ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX "GsamScoEdition_reference_key" ON "GsamScoEdition"("reference");
CREATE INDEX "GsamScoEdition_state_createdAt_idx" ON "GsamScoEdition"("state", "createdAt");

CREATE TABLE "GsamScoEditionEvent" (
  "id" TEXT NOT NULL,
  "editionId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventDetail" JSONB,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GsamScoEditionEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GsamScoEditionEvent_editionId_occurredAt_idx" ON "GsamScoEditionEvent"("editionId", "occurredAt");
ALTER TABLE "GsamScoEditionEvent" ADD CONSTRAINT "GsamScoEditionEvent_editionId_fkey"
  FOREIGN KEY ("editionId") REFERENCES "GsamScoEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Mutation prevention is a database-level safeguard against accidental changes.
CREATE FUNCTION gsam_sco_reject_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'GSAM candidate edition and event records are append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER gsam_sco_edition_immutable BEFORE UPDATE OR DELETE ON "GsamScoEdition"
  FOR EACH ROW EXECUTE FUNCTION gsam_sco_reject_change();
CREATE TRIGGER gsam_sco_event_immutable BEFORE UPDATE OR DELETE ON "GsamScoEditionEvent"
  FOR EACH ROW EXECUTE FUNCTION gsam_sco_reject_change();
