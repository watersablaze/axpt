/*
  Warnings:

  - The `mode` column on the `Case` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Case` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Gate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `createdAt` on table `Case` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Case` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Gate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Gate` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ESCROW_INITIATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseMode" AS ENUM ('COORDINATION_ONLY', 'FULL_ESCROW');

-- CreateEnum
CREATE TYPE "GateStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Gate" DROP CONSTRAINT "Gate_caseId_fkey";

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "mode",
ADD COLUMN     "mode" "CaseMode" NOT NULL DEFAULT 'COORDINATION_ONLY',
DROP COLUMN "status",
ADD COLUMN     "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Gate" DROP COLUMN "status",
ADD COLUMN     "status" "GateStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Gate" ADD CONSTRAINT "Gate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
