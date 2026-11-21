CREATE TABLE "GlobalMotherRecipientChallenge" (
  "grantId" TEXT NOT NULL,
  "recipientUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "pinHash" TEXT NOT NULL,
  "nonceHash" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3) NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "sendCount" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "GlobalMotherRecipientChallenge_pkey" PRIMARY KEY ("grantId"),
  CONSTRAINT "GlobalMotherRecipientChallenge_grantId_fkey"
    FOREIGN KEY ("grantId") REFERENCES "InstrumentAccessGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "GlobalMotherRecipientChallenge_expiresAt_idx"
  ON "GlobalMotherRecipientChallenge"("expiresAt");
