CREATE TABLE "GsamEmailDelivery" (
 "id" TEXT NOT NULL,
 "key" TEXT NOT NULL,
 "recipientEmail" TEXT NOT NULL,
 "grantIds" TEXT[] NOT NULL,
 "actorUserId" TEXT NOT NULL,
 "status" TEXT NOT NULL,
 "messageId" TEXT,
 "error" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "GsamEmailDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GsamEmailDelivery_key_key" ON "GsamEmailDelivery"("key");
CREATE INDEX "GsamEmailDelivery_status_createdAt_idx" ON "GsamEmailDelivery"("status", "createdAt");
