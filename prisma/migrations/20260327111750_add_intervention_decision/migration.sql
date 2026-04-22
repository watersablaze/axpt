/*
  Warnings:

  - You are about to drop the column `context` on the `InterventionDecision` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InterventionDecision" DROP COLUMN "context",
ADD COLUMN     "reason" TEXT;
