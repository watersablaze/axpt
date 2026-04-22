/*
  Warnings:

  - You are about to drop the column `actionType` on the `QueueHistory` table. All the data in the column will be lost.
  - You are about to drop the column `event` on the `QueueHistory` table. All the data in the column will be lost.
  - You are about to drop the column `queueItemId` on the `QueueHistory` table. All the data in the column will be lost.
  - You are about to drop the column `actionType` on the `QueueItem` table. All the data in the column will be lost.
  - You are about to drop the column `blocking` on the `QueueItem` table. All the data in the column will be lost.
  - Added the required column `action` to the `QueueHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `QueueItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "QueueHistory_queueItemId_idx";

-- DropIndex
DROP INDEX "QueueItem_assignedTo_idx";

-- AlterTable
ALTER TABLE "QueueHistory" DROP COLUMN "actionType",
DROP COLUMN "event",
DROP COLUMN "queueItemId",
ADD COLUMN     "action" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QueueItem" DROP COLUMN "actionType",
DROP COLUMN "blocking",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "urgency" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "risk" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "value" SET DATA TYPE DOUBLE PRECISION;
