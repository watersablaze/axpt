ALTER TABLE "InstrumentAccessGrant"
  ADD COLUMN "instrumentVersionId" TEXT,
  ADD COLUMN "representedInstitution" TEXT,
  ADD COLUMN "representativeCapacity" TEXT;

CREATE INDEX "InstrumentAccessGrant_instrumentVersionId_idx"
  ON "InstrumentAccessGrant"("instrumentVersionId");
ALTER TABLE "InstrumentAccessGrant" ADD CONSTRAINT "InstrumentAccessGrant_instrumentVersionId_fkey"
  FOREIGN KEY ("instrumentVersionId") REFERENCES "InstrumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "InstrumentResponseSet" (
  "id" TEXT NOT NULL,
  "instrumentId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "grantId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "submissionKey" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "representedInstitution" TEXT NOT NULL,
  "representativeCapacity" TEXT NOT NULL,
  "positions" JSONB NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InstrumentResponseSet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InstrumentResponseSet_versionId_actorUserId_submissionKey_key"
  ON "InstrumentResponseSet"("versionId", "actorUserId", "submissionKey");
CREATE UNIQUE INDEX "InstrumentResponseSet_versionId_actorUserId_key"
  ON "InstrumentResponseSet"("versionId", "actorUserId");
CREATE INDEX "InstrumentResponseSet_instrumentId_recordedAt_idx"
  ON "InstrumentResponseSet"("instrumentId", "recordedAt");
CREATE INDEX "InstrumentResponseSet_grantId_idx"
  ON "InstrumentResponseSet"("grantId");
ALTER TABLE "InstrumentResponseSet" ADD CONSTRAINT "InstrumentResponseSet_instrumentId_fkey"
  FOREIGN KEY ("instrumentId") REFERENCES "InstitutionalInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentResponseSet" ADD CONSTRAINT "InstrumentResponseSet_versionId_fkey"
  FOREIGN KEY ("versionId") REFERENCES "InstrumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentResponseSet" ADD CONSTRAINT "InstrumentResponseSet_grantId_fkey"
  FOREIGN KEY ("grantId") REFERENCES "InstrumentAccessGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstrumentResponseSet" ADD CONSTRAINT "InstrumentResponseSet_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
