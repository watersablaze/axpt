-- AlterTable
ALTER TABLE "CommunicationMessage" ADD COLUMN     "workflowTargetId" TEXT,
ADD COLUMN     "workflowTargetSubtype" TEXT,
ADD COLUMN     "workflowTargetType" "CommunicationOperationalTargetType";

-- CreateIndex
CREATE INDEX "CommunicationMessage_workflowTargetType_workflowTargetSubty_idx" ON "CommunicationMessage"("workflowTargetType", "workflowTargetSubtype", "workflowTargetId");

-- Enforce workflow target pointer integrity.
-- A message either carries no workflow reference,
-- or carries a complete type/subtype/id tuple.
ALTER TABLE "CommunicationMessage"
ADD CONSTRAINT "CommunicationMessage_workflowTargetPointer_complete"
CHECK (
  (
    "workflowTargetType" IS NULL
    AND "workflowTargetSubtype" IS NULL
    AND "workflowTargetId" IS NULL
  )
  OR
  (
    "workflowTargetType" IS NOT NULL
    AND "workflowTargetSubtype" IS NOT NULL
    AND "workflowTargetId" IS NOT NULL
  )
);
