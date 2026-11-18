-- FW LOI access notice · delivery evidence only.
-- This migration does not send email, create access grants, or change decisions.
CREATE TABLE "CommercialIntakeAccessNoticeDelivery" (
    "id" TEXT NOT NULL,
    "deliveryKey" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENDING',
    "providerMessageId" TEXT,
    "errorCode" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommercialIntakeAccessNoticeDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommercialIntakeAccessNoticeDelivery_deliveryKey_key"
    ON "CommercialIntakeAccessNoticeDelivery"("deliveryKey");
CREATE INDEX "CommercialIntakeAccessNoticeDelivery_requestId_attemptedAt_idx"
    ON "CommercialIntakeAccessNoticeDelivery"("requestId", "attemptedAt");
CREATE INDEX "CommercialIntakeAccessNoticeDelivery_grantId_attemptedAt_idx"
    ON "CommercialIntakeAccessNoticeDelivery"("grantId", "attemptedAt");
CREATE INDEX "CommercialIntakeAccessNoticeDelivery_status_attemptedAt_idx"
    ON "CommercialIntakeAccessNoticeDelivery"("status", "attemptedAt");

-- Prevent two concurrent, unresolved sends for the same effective grant.
-- The operator must reconcile DELIVERY_UNKNOWN before a fresh delivery attempt.
CREATE UNIQUE INDEX "fw_loi_notice_one_unresolved_per_grant"
    ON "CommercialIntakeAccessNoticeDelivery"("grantId")
    WHERE "status" IN ('SENDING', 'DELIVERY_UNKNOWN');
