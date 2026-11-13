CREATE TABLE "FrenchWardInstitutionalInvitationDelivery" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "deliveryKey" TEXT NOT NULL,
    "issuerUserId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "providerErrorCode" TEXT,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrenchWardInstitutionalInvitationDelivery_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "FWInvitationDelivery_status_check"
        CHECK ("status" IN (
            'SENDING',
            'DISPATCHING',
            'PROVIDER_ACCEPTED',
            'FAILED',
            'DELIVERY_UNKNOWN'
        )),

    CONSTRAINT "FWInvitationDelivery_invitation_fkey"
        FOREIGN KEY ("invitationId")
        REFERENCES "FrenchWardInstitutionalInvitation"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "FWInvitationDelivery_issuer_fkey"
        FOREIGN KEY ("issuerUserId")
        REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FWInvitationDelivery_invitationId_key"
    ON "FrenchWardInstitutionalInvitationDelivery"("invitationId");

CREATE UNIQUE INDEX "FWInvitationDelivery_deliveryKey_key"
    ON "FrenchWardInstitutionalInvitationDelivery"("deliveryKey");

CREATE INDEX "FWInvitationDelivery_status_claimedAt_idx"
    ON "FrenchWardInstitutionalInvitationDelivery"("status", "claimedAt");

CREATE INDEX "FWInvitationDelivery_issuer_claimedAt_idx"
    ON "FrenchWardInstitutionalInvitationDelivery"("issuerUserId", "claimedAt");
