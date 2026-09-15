/*
  Warnings:

  - Added the required column `updatedAt` to the `Artifact` table without a default value. This is not possible if the table is not empty.
  - Made the column `createdAt` on table `Artifact` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Artifact` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Party` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `Party` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `createdAt` on table `Party` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Party" DROP CONSTRAINT "Party_caseId_fkey";

-- AlterTable
ALTER TABLE "Artifact" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'MISSING';

-- AlterTable
ALTER TABLE "Party" ADD COLUMN     "address" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passportNo" TEXT,
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "CasePartyRole" NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Artifact_caseId_type_idx" ON "Artifact"("caseId", "type");

-- CreateIndex
CREATE INDEX "Party_caseId_role_idx" ON "Party"("caseId", "role");

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
