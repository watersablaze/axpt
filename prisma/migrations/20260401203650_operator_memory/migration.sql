/*
  Warnings:

  - You are about to drop the column `confidenceScore` on the `OperatorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `failureCount` on the `OperatorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `successCount` on the `OperatorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `successRate` on the `OperatorProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OperatorProfile" DROP COLUMN "confidenceScore",
DROP COLUMN "failureCount",
DROP COLUMN "successCount",
DROP COLUMN "successRate",
ADD COLUMN     "correctDecisions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weightedScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
