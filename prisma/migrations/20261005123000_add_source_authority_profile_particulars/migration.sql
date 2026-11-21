CREATE TABLE "SourceAuthorityProfileParticulars" (
    "id" TEXT NOT NULL,
    "sourceAuthorityId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "documentReference" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "documentStatus" TEXT NOT NULL,
    "registrationReference" TEXT,
    "registrationStanding" TEXT NOT NULL,
    "registeredAddress" TEXT,
    "authorizedRepresentativeName" TEXT,
    "authorizedRepresentativeCapacity" TEXT,
    "officialContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceAuthorityProfileParticulars_pkey"
      PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
  "SourceAuthorityProfileParticulars_sourceAuthorityId_versionId_key"
  ON "SourceAuthorityProfileParticulars"(
    "sourceAuthorityId",
    "versionId"
  );

CREATE INDEX
  "SourceAuthorityProfileParticulars_versionId_idx"
  ON "SourceAuthorityProfileParticulars"(
    "versionId"
  );

CREATE INDEX
  "SourceAuthorityProfileParticulars_documentReference_idx"
  ON "SourceAuthorityProfileParticulars"(
    "documentReference"
  );

ALTER TABLE "SourceAuthorityProfileParticulars"
  ADD CONSTRAINT
    "SourceAuthorityProfileParticulars_sourceAuthorityId_fkey"
  FOREIGN KEY ("sourceAuthorityId")
  REFERENCES "SourceAuthorityRecord"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "SourceAuthorityProfileParticulars"
  ADD CONSTRAINT
    "SourceAuthorityProfileParticulars_versionId_fkey"
  FOREIGN KEY ("versionId")
  REFERENCES "InstrumentVersion"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
