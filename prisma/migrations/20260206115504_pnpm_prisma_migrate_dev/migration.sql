/*
  Warnings:

  - Added the required column `source` to the `Artifact` table without a default value. This is not possible if the table is not empty.
  - Made the column `hash` on table `Artifact` required. This step will fail if there are existing NULL values in that column.
  - Made the column `url` on table `Artifact` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Artifact` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Artifact" ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "source" TEXT NOT NULL,
ALTER COLUMN "hash" SET NOT NULL,
ALTER COLUMN "url" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Artifact_caseId_idx" ON "Artifact"("caseId");

-- CreateIndex
CREATE INDEX "Artifact_type_idx" ON "Artifact"("type");
