-- Bind governed DSI verification recognition to:
-- 1. the exact canonical Treasury settlement observation; and
-- 2. the exact issued institutional instrument version.
--
-- These fields remain nullable before recognition.
--
-- The observation binding is unique so one canonical chain observation
-- cannot satisfy more than one Digital Settlement Instruction.

ALTER TABLE "DigitalSettlementInstruction"
ADD COLUMN "verificationObservationId" TEXT,
ADD COLUMN "verificationInstrumentVersionId" TEXT;

CREATE UNIQUE INDEX
"DigitalSettlementInstruction_verificationObservationId_key"
ON "DigitalSettlementInstruction"("verificationObservationId");

CREATE INDEX
"DigitalSettlementInstruction_verificationInstrumentVersionId_idx"
ON "DigitalSettlementInstruction"("verificationInstrumentVersionId");

ALTER TABLE "DigitalSettlementInstruction"
ADD CONSTRAINT
"DigitalSettlementInstruction_verificationObservationId_fkey"
FOREIGN KEY ("verificationObservationId")
REFERENCES "TreasurySettlementObservation"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "DigitalSettlementInstruction"
ADD CONSTRAINT
"DigitalSettlementInstruction_verificationInstrumentVersionId_fkey"
FOREIGN KEY ("verificationInstrumentVersionId")
REFERENCES "InstrumentVersion"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
