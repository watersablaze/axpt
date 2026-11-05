-- CreateEnum
CREATE TYPE "InstitutionalMatterKind" AS ENUM ('COMMERCIAL_TRANSACTION');

-- CreateEnum
CREATE TYPE "InstitutionalMatterRecordKind" AS ENUM ('INTAKE', 'OPPORTUNITY', 'DOSSIER');

-- CreateEnum
CREATE TYPE "InstitutionalMatterEventType" AS ENUM ('MATTER_ESTABLISHED', 'RECORD_LINKED', 'CURRENT_RECORD_ADVANCED');

-- CreateTable
CREATE TABLE "InstitutionalMatter" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "institutionalDomain" TEXT NOT NULL,
    "institutionalPrincipal" TEXT NOT NULL,
    "coordinationEnvironment" TEXT NOT NULL,
    "matterKind" "InstitutionalMatterKind" NOT NULL,
    "currentRecordKind" "InstitutionalMatterRecordKind" NOT NULL,
    "currentRecordId" TEXT NOT NULL,
    "currentRecordReference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionalMatter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalMatterRecord" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "recordKind" "InstitutionalMatterRecordKind" NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordReference" TEXT NOT NULL,
    "linkedBy" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalMatterRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalMatterEvent" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "eventType" "InstitutionalMatterEventType" NOT NULL,
    "actor" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalMatterEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalMatter_reference_key" ON "InstitutionalMatter"("reference");

-- CreateIndex
CREATE INDEX "InstitutionalMatter_institutionalDomain_matterKind_idx" ON "InstitutionalMatter"("institutionalDomain", "matterKind");

-- CreateIndex
CREATE INDEX "InstitutionalMatter_institutionalPrincipal_idx" ON "InstitutionalMatter"("institutionalPrincipal");

-- CreateIndex
CREATE INDEX "InstitutionalMatter_currentRecordKind_currentRecordId_idx" ON "InstitutionalMatter"("currentRecordKind", "currentRecordId");

-- CreateIndex
CREATE INDEX "InstitutionalMatter_updatedAt_idx" ON "InstitutionalMatter"("updatedAt");

-- CreateIndex
CREATE INDEX "InstitutionalMatterRecord_matterId_linkedAt_idx" ON "InstitutionalMatterRecord"("matterId", "linkedAt");

-- CreateIndex
CREATE INDEX "InstitutionalMatterRecord_recordReference_idx" ON "InstitutionalMatterRecord"("recordReference");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalMatterRecord_recordKind_recordId_key" ON "InstitutionalMatterRecord"("recordKind", "recordId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalMatterRecord_recordKind_recordReference_key" ON "InstitutionalMatterRecord"("recordKind", "recordReference");

-- CreateIndex
CREATE INDEX "InstitutionalMatterEvent_matterId_createdAt_idx" ON "InstitutionalMatterEvent"("matterId", "createdAt");

-- CreateIndex
CREATE INDEX "InstitutionalMatterEvent_eventType_idx" ON "InstitutionalMatterEvent"("eventType");

-- CreateIndex
CREATE INDEX "InstitutionalMatterEvent_actor_idx" ON "InstitutionalMatterEvent"("actor");

-- AddForeignKey
ALTER TABLE "InstitutionalMatterRecord" ADD CONSTRAINT "InstitutionalMatterRecord_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "InstitutionalMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalMatterEvent" ADD CONSTRAINT "InstitutionalMatterEvent_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "InstitutionalMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
