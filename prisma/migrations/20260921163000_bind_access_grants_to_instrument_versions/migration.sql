-- Bind newly issued access credentials to the exact institutional
-- instrument version they were created for.
--
-- Nullable by design: historical grants predate version-bound access
-- semantics and remain valid without backfill.

ALTER TABLE "InstrumentAccessGrant"
ADD COLUMN "instrumentVersionId" TEXT;

CREATE INDEX "InstrumentAccessGrant_instrumentVersionId_idx"
ON "InstrumentAccessGrant"("instrumentVersionId");

ALTER TABLE "InstrumentAccessGrant"
ADD CONSTRAINT "InstrumentAccessGrant_instrumentVersionId_fkey"
FOREIGN KEY ("instrumentVersionId")
REFERENCES "InstrumentVersion"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
