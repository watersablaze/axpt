CREATE TABLE IF NOT EXISTS "IntakeRepresentative" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "company" TEXT,
  "program" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IntakeRepresentative_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntakeRepresentative_code_key"
  ON "IntakeRepresentative"("code");

CREATE INDEX IF NOT EXISTS "IntakeRepresentative_code_idx"
  ON "IntakeRepresentative"("code");

CREATE INDEX IF NOT EXISTS "IntakeRepresentative_status_idx"
  ON "IntakeRepresentative"("status");

CREATE INDEX IF NOT EXISTS "IntakeRepresentative_program_idx"
  ON "IntakeRepresentative"("program");
