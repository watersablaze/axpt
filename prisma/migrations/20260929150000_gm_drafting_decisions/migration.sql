CREATE TABLE "GlobalMotherDraftingDecision" (
  "id" TEXT NOT NULL,
  "instrumentId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "decisionKey" TEXT NOT NULL,
  "standing" TEXT NOT NULL,
  "reviewedReceiptIds" JSONB NOT NULL,
  "rationale" TEXT NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GlobalMotherDraftingDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GlobalMotherDraftingDecision_standing_check" CHECK ("standing" IN ('REVIEW_HOLD', 'OPEN_DRAFTING'))
);
CREATE UNIQUE INDEX "GlobalMotherDraftingDecision_decisionKey_key" ON "GlobalMotherDraftingDecision"("decisionKey");
CREATE INDEX "GlobalMotherDraftingDecision_versionId_recordedAt_idx" ON "GlobalMotherDraftingDecision"("versionId", "recordedAt");
ALTER TABLE "GlobalMotherDraftingDecision" ADD CONSTRAINT "GlobalMotherDraftingDecision_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "InstitutionalInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GlobalMotherDraftingDecision" ADD CONSTRAINT "GlobalMotherDraftingDecision_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "InstrumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GlobalMotherDraftingDecision" ADD CONSTRAINT "GlobalMotherDraftingDecision_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
