-- DropForeignKey
ALTER TABLE "Artifact" DROP CONSTRAINT "Artifact_caseId_fkey";

-- AlterTable
ALTER TABLE "Artifact" ADD COLUMN     "status" TEXT;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
