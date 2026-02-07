/*
  Warnings:

  - You are about to drop the column `mimeType` on the `Artifact` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Artifact` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Artifact_caseId_idx";

-- DropIndex
DROP INDEX "Artifact_type_idx";

-- AlterTable
ALTER TABLE "Artifact" DROP COLUMN "mimeType",
DROP COLUMN "source",
ALTER COLUMN "hash" DROP NOT NULL,
ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP NOT NULL;
