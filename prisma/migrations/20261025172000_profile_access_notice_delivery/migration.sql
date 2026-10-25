CREATE TABLE "ProfileAccessNoticeDelivery" (
    "id" TEXT NOT NULL,
    "deliveryKey" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "error" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileAccessNoticeDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileAccessNoticeDelivery_deliveryKey_key"
ON "ProfileAccessNoticeDelivery"("deliveryKey");

CREATE INDEX "ProfileAccessNoticeDelivery_requestId_attemptedAt_idx"
ON "ProfileAccessNoticeDelivery"("requestId", "attemptedAt");

CREATE INDEX "ProfileAccessNoticeDelivery_grantId_attemptedAt_idx"
ON "ProfileAccessNoticeDelivery"("grantId", "attemptedAt");

CREATE INDEX "ProfileAccessNoticeDelivery_status_attemptedAt_idx"
ON "ProfileAccessNoticeDelivery"("status", "attemptedAt");
