-- Complete DomainEvent index parity with the canonical Prisma schema.
-- Structural only; no institutional or settlement data is changed.
CREATE INDEX IF NOT EXISTS "DomainEvent_occurredAt_idx"
ON "DomainEvent"("occurredAt");
