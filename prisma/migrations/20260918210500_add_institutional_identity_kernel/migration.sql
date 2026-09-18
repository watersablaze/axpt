-- CreateEnum
CREATE TYPE "InstitutionalRoleClass" AS ENUM (
  'EXECUTIVE_AUTHORITY',
  'SENIOR_OPERATING_AUTHORITY',
  'FIELD_OPERATOR',
  'FIDUCIARY_AUTHORITY',
  'STRATEGIC_OPERATOR',
  'TREASURY_OPERATOR',
  'LEGAL_OPERATOR',
  'ADMINISTRATOR',
  'REPRESENTATIVE',
  'OBSERVER'
);

-- CreateEnum
CREATE TYPE "InstitutionalOrganizationalUnit" AS ENUM (
  'EXECUTIVE',
  'STRATEGY',
  'OPERATIONS',
  'LOGISTICS',
  'LEGAL',
  'FIDUCIARY',
  'TREASURY',
  'INSTITUTIONAL_RELATIONS',
  'PLATFORM'
);

-- CreateEnum
CREATE TYPE "InstitutionalStanding" AS ENUM (
  'PROVISIONAL',
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'INACTIVE'
);

-- CreateTable
CREATE TABLE "InstitutionalProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "institutionalTitle" TEXT NOT NULL,
  "roleClass" "InstitutionalRoleClass" NOT NULL,
  "organizationalUnit" "InstitutionalOrganizationalUnit" NOT NULL,
  "standing" "InstitutionalStanding" NOT NULL DEFAULT 'ACTIVE',
  "operatorCode" TEXT NOT NULL,
  "reportsToProfileId" TEXT,
  "fiduciaryIndependent" BOOLEAN NOT NULL DEFAULT false,
  "summary" TEXT,
  "responsibilities" JSONB,
  "metadata" JSONB,
  "activatedAt" TIMESTAMP(3),
  "suspendedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InstitutionalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalProfile_userId_key"
ON "InstitutionalProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalProfile_operatorCode_key"
ON "InstitutionalProfile"("operatorCode");

-- CreateIndex
CREATE INDEX "InstitutionalProfile_roleClass_idx"
ON "InstitutionalProfile"("roleClass");

-- CreateIndex
CREATE INDEX "InstitutionalProfile_organizationalUnit_idx"
ON "InstitutionalProfile"("organizationalUnit");

-- CreateIndex
CREATE INDEX "InstitutionalProfile_standing_idx"
ON "InstitutionalProfile"("standing");

-- CreateIndex
CREATE INDEX "InstitutionalProfile_reportsToProfileId_idx"
ON "InstitutionalProfile"("reportsToProfileId");

-- AddForeignKey
ALTER TABLE "InstitutionalProfile"
ADD CONSTRAINT "InstitutionalProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionalProfile"
ADD CONSTRAINT "InstitutionalProfile_reportsToProfileId_fkey"
FOREIGN KEY ("reportsToProfileId") REFERENCES "InstitutionalProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
