/*
  Warnings:

  - A unique constraint covering the columns `[intent,assetCode,systemState]` on the table `IntentWeightProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "IntentWeightProfile_intent_key";

-- AlterTable
ALTER TABLE "IntentWeightProfile" ADD COLUMN     "assetCode" TEXT,
ADD COLUMN     "systemState" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "IntentWeightProfile_intent_assetCode_systemState_key" ON "IntentWeightProfile"("intent", "assetCode", "systemState");
