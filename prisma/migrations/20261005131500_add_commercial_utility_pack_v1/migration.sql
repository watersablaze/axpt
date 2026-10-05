-- CreateEnum
CREATE TYPE "CommercialUtilityPackState" AS ENUM ('PREPARING', 'CURRENT', 'SUPERSEDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CommercialUtilityPackReleaseState" AS ENUM ('WITHHELD', 'PARTIAL', 'RELEASED');

-- CreateEnum
CREATE TYPE "CommercialUtilityPackAudience" AS ENUM ('REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "CommercialUtilityPackModule" AS ENUM ('REPRESENTATION', 'COMMERCIAL_PARAMETERS', 'DOCUMENTS', 'OPERATING_BOUNDARIES');

-- CreateEnum
CREATE TYPE "CommercialUtilityPackModuleState" AS ENUM ('WITHHELD', 'READY', 'RELEASED');

-- CreateEnum
CREATE TYPE "CommercialUtilityPackResourceType" AS ENUM ('INSTITUTIONAL_INSTRUMENT', 'DOCUMENT', 'STRUCTURED_CONTENT');

-- CreateEnum
CREATE TYPE "CommercialUtilityPackResourceState" AS ENUM ('WITHHELD', 'RELEASED', 'SUPERSEDED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "CommercialUtilityPack" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "state" "CommercialUtilityPackState" NOT NULL DEFAULT 'PREPARING',
    "releaseState" "CommercialUtilityPackReleaseState" NOT NULL DEFAULT 'WITHHELD',
    "audience" "CommercialUtilityPackAudience" NOT NULL DEFAULT 'REPRESENTATIVE',
    "createdByUserId" TEXT NOT NULL,
    "releasedByUserId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialUtilityPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialUtilityPackModuleRelease" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "module" "CommercialUtilityPackModule" NOT NULL,
    "state" "CommercialUtilityPackModuleState" NOT NULL DEFAULT 'WITHHELD',
    "releasedByUserId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialUtilityPackModuleRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialUtilityPackResourceRelease" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "module" "CommercialUtilityPackModule" NOT NULL,
    "resourceType" "CommercialUtilityPackResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "state" "CommercialUtilityPackResourceState" NOT NULL DEFAULT 'WITHHELD',
    "label" TEXT,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canDownload" BOOLEAN NOT NULL DEFAULT false,
    "canPresent" BOOLEAN NOT NULL DEFAULT false,
    "canTransmit" BOOLEAN NOT NULL DEFAULT false,
    "releasedByUserId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialUtilityPackResourceRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommercialUtilityPack_reference_key" ON "CommercialUtilityPack"("reference");

-- CreateIndex
CREATE INDEX "CommercialUtilityPack_participantId_state_idx" ON "CommercialUtilityPack"("participantId", "state");

-- CreateIndex
CREATE INDEX "CommercialUtilityPack_releaseState_idx" ON "CommercialUtilityPack"("releaseState");

-- CreateIndex
CREATE INDEX "CommercialUtilityPack_createdByUserId_idx" ON "CommercialUtilityPack"("createdByUserId");

-- CreateIndex
CREATE INDEX "CommercialUtilityPack_releasedByUserId_idx" ON "CommercialUtilityPack"("releasedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialUtilityPack_participantId_version_key" ON "CommercialUtilityPack"("participantId", "version");

-- CreateIndex
CREATE INDEX "CommercialUtilityPackModuleRelease_packageId_state_idx" ON "CommercialUtilityPackModuleRelease"("packageId", "state");

-- CreateIndex
CREATE INDEX "CommercialUtilityPackModuleRelease_releasedByUserId_idx" ON "CommercialUtilityPackModuleRelease"("releasedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialUtilityPackModuleRelease_packageId_module_key" ON "CommercialUtilityPackModuleRelease"("packageId", "module");

-- CreateIndex
CREATE INDEX "CommercialUtilityPackResourceRelease_packageId_module_state_idx" ON "CommercialUtilityPackResourceRelease"("packageId", "module", "state");

-- CreateIndex
CREATE INDEX "CommercialUtilityPackResourceRelease_resourceType_resourceI_idx" ON "CommercialUtilityPackResourceRelease"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "CommercialUtilityPackResourceRelease_releasedByUserId_idx" ON "CommercialUtilityPackResourceRelease"("releasedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialUtilityPackResourceRelease_packageId_module_resou_key" ON "CommercialUtilityPackResourceRelease"("packageId", "module", "resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "CommercialUtilityPack" ADD CONSTRAINT "CommercialUtilityPack_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "RepresentativeProgramParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialUtilityPack" ADD CONSTRAINT "CommercialUtilityPack_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialUtilityPack" ADD CONSTRAINT "CommercialUtilityPack_releasedByUserId_fkey" FOREIGN KEY ("releasedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialUtilityPackModuleRelease" ADD CONSTRAINT "CommercialUtilityPackModuleRelease_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CommercialUtilityPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialUtilityPackModuleRelease" ADD CONSTRAINT "CommercialUtilityPackModuleRelease_releasedByUserId_fkey" FOREIGN KEY ("releasedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialUtilityPackResourceRelease" ADD CONSTRAINT "CommercialUtilityPackResourceRelease_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CommercialUtilityPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialUtilityPackResourceRelease" ADD CONSTRAINT "CommercialUtilityPackResourceRelease_releasedByUserId_fkey" FOREIGN KEY ("releasedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
