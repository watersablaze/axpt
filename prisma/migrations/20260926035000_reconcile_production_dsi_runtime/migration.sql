-- AXPT Production DSI Runtime Reconciliation
--
-- Purpose:
--   Reconcile runtime objects required by the canonical IGR DSI path
--   without replaying historical migrations against the baselined
--   Production database.
--
-- Authority is tested structurally rather than only by historical
-- object name. Preview contains equivalent authorities under earlier
-- index / constraint names and must remain a true no-op.
--
-- This migration does NOT:
--   - create or mutate FW-DSI-2026-001
--   - create access grants
--   - recognize settlement
--   - authorize TAP
--   - mutate transaction state

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- DOMAIN EVENT RUNTIME AUTHORITY
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "DomainEvent" (
    "id" TEXT NOT NULL,
    "streamType" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainEvent_pkey"
      PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS
"DomainEvent_streamType_streamId_idx"
ON "DomainEvent"("streamType", "streamId");

CREATE INDEX IF NOT EXISTS
"DomainEvent_eventType_idx"
ON "DomainEvent"("eventType");

CREATE INDEX IF NOT EXISTS
"DomainEvent_processedAt_idx"
ON "DomainEvent"("processedAt");

-- ─────────────────────────────────────────────────────────────
-- DSI VERIFICATION BINDING COLUMNS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "DigitalSettlementInstruction"
ADD COLUMN IF NOT EXISTS
"verificationObservationId" TEXT;

ALTER TABLE "DigitalSettlementInstruction"
ADD COLUMN IF NOT EXISTS
"verificationInstrumentVersionId" TEXT;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION OBSERVATION UNIQUE INDEX
--
-- Accept any existing valid, simple, single-column UNIQUE
-- B-tree authority on verificationObservationId regardless of
-- its historical object name.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index ix
    JOIN pg_class t
      ON t.oid = ix.indrelid
    JOIN pg_class i
      ON i.oid = ix.indexrelid
    JOIN pg_am am
      ON am.oid = i.relam
    JOIN pg_attribute a
      ON a.attrelid = t.oid
     AND a.attnum = ANY(ix.indkey)
    WHERE t.oid =
      '"DigitalSettlementInstruction"'::regclass
      AND a.attname =
        'verificationObservationId'
      AND ix.indisvalid
      AND ix.indisready
      AND ix.indisunique
      AND ix.indnkeyatts = 1
      AND ix.indnatts = 1
      AND ix.indpred IS NULL
      AND ix.indexprs IS NULL
      AND am.amname = 'btree'
  ) THEN
    CREATE UNIQUE INDEX
    "DigitalSettlementInstruction_verificationObservationId_key"
    ON "DigitalSettlementInstruction"
      ("verificationObservationId");
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION VERSION INDEX
--
-- Accept any existing valid, simple, single-column NON-UNIQUE
-- B-tree authority on verificationInstrumentVersionId,
-- including Preview's historical ...VersionId_id name.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index ix
    JOIN pg_class t
      ON t.oid = ix.indrelid
    JOIN pg_class i
      ON i.oid = ix.indexrelid
    JOIN pg_am am
      ON am.oid = i.relam
    JOIN pg_attribute a
      ON a.attrelid = t.oid
     AND a.attnum = ANY(ix.indkey)
    WHERE t.oid =
      '"DigitalSettlementInstruction"'::regclass
      AND a.attname =
        'verificationInstrumentVersionId'
      AND ix.indisvalid
      AND ix.indisready
      AND NOT ix.indisunique
      AND ix.indnkeyatts = 1
      AND ix.indnatts = 1
      AND ix.indpred IS NULL
      AND ix.indexprs IS NULL
      AND am.amname = 'btree'
  ) THEN
    CREATE INDEX
    "DigitalSettlementInstruction_verificationInstrumentVersionId_idx"
    ON "DigitalSettlementInstruction"
      ("verificationInstrumentVersionId");
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION OBSERVATION FOREIGN KEY
--
-- Test the relationship itself rather than constraint name.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.conrelid =
        '"DigitalSettlementInstruction"'::regclass
      AND c.confrelid =
        '"TreasurySettlementObservation"'::regclass
      AND array_length(c.conkey, 1) = 1
      AND array_length(c.confkey, 1) = 1
      AND (
        SELECT a.attname
        FROM pg_attribute a
        WHERE a.attrelid = c.conrelid
          AND a.attnum = c.conkey[1]
      ) = 'verificationObservationId'
      AND (
        SELECT a.attname
        FROM pg_attribute a
        WHERE a.attrelid = c.confrelid
          AND a.attnum = c.confkey[1]
      ) = 'id'
      AND c.confupdtype = 'c'
      AND c.confdeltype = 'n'
  ) THEN
    ALTER TABLE "DigitalSettlementInstruction"
    ADD CONSTRAINT
    "DigitalSettlementInstruction_verificationObservationId_fkey"
    FOREIGN KEY ("verificationObservationId")
    REFERENCES "TreasurySettlementObservation"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION VERSION FOREIGN KEY
--
-- Preview's historical constraint uses ...VersionId_fk.
-- Structural equivalence is authoritative.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.conrelid =
        '"DigitalSettlementInstruction"'::regclass
      AND c.confrelid =
        '"InstrumentVersion"'::regclass
      AND array_length(c.conkey, 1) = 1
      AND array_length(c.confkey, 1) = 1
      AND (
        SELECT a.attname
        FROM pg_attribute a
        WHERE a.attrelid = c.conrelid
          AND a.attnum = c.conkey[1]
      ) = 'verificationInstrumentVersionId'
      AND (
        SELECT a.attname
        FROM pg_attribute a
        WHERE a.attrelid = c.confrelid
          AND a.attnum = c.confkey[1]
      ) = 'id'
      AND c.confupdtype = 'c'
      AND c.confdeltype = 'n'
  ) THEN
    ALTER TABLE "DigitalSettlementInstruction"
    ADD CONSTRAINT
    "DigitalSettlementInstruction_verificationInstrumentVersionId_fkey"
    FOREIGN KEY ("verificationInstrumentVersionId")
    REFERENCES "InstrumentVersion"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END
$$;

COMMIT;
