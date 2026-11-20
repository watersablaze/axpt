CREATE TABLE "FrenchWardLoiInvitation" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "governingReference" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientOrganization" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "policy" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "deliveryStatus" TEXT NOT NULL DEFAULT 'QUEUED',
    "messageId" TEXT,
    "deliveryError" TEXT,
    "attemptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrenchWardLoiInvitation_pkey"
      PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
  "FrenchWardLoiInvitation_requestId_key"
  ON "FrenchWardLoiInvitation"("requestId");

CREATE UNIQUE INDEX
  "FrenchWardLoiInvitation_grantId_key"
  ON "FrenchWardLoiInvitation"("grantId");

CREATE UNIQUE INDEX
  "FrenchWardLoiInvitation_actorUserId_idempotencyKey_key"
  ON "FrenchWardLoiInvitation"("actorUserId", "idempotencyKey");

CREATE INDEX
  "FrenchWardLoiInvitation_recipientEmail_expiresAt_idx"
  ON "FrenchWardLoiInvitation"("recipientEmail", "expiresAt");

CREATE INDEX
  "FrenchWardLoiInvitation_deliveryStatus_createdAt_idx"
  ON "FrenchWardLoiInvitation"("deliveryStatus", "createdAt");

CREATE INDEX
  "FrenchWardLoiInvitation_actorUserId_createdAt_idx"
  ON "FrenchWardLoiInvitation"("actorUserId", "createdAt");
