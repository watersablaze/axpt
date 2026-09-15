/*
  Warnings:

  - Added the required column `operatorId` to the `InterventionDecision` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OperatorArchetype" AS ENUM ('EXECUTOR', 'GUARDIAN', 'ANALYST', 'DIPLOMAT');

-- AlterTable
ALTER TABLE "InterventionDecision" ADD COLUMN     "operatorId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archetype" "OperatorArchetype" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InterventionDecision" ADD CONSTRAINT "InterventionDecision_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorProfile" ADD CONSTRAINT "OperatorProfile_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
