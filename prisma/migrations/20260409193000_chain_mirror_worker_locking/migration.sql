ALTER TYPE "ChainMirrorJobStatus" ADD VALUE IF NOT EXISTS 'SUBMITTING';

ALTER TABLE "ChainMirrorJob"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastHeartbeatAt" TIMESTAMP(3),
ADD COLUMN "submissionStartedAt" TIMESTAMP(3);

CREATE INDEX "ChainMirrorJob_status_claimOwner_claimedAt_idx"
ON "ChainMirrorJob"("status", "claimOwner", "claimedAt");

CREATE INDEX "ChainMirrorJob_status_submissionStartedAt_idx"
ON "ChainMirrorJob"("status", "submissionStartedAt");
