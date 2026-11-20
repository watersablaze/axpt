-- French-Ward governing LOI public credential.
--
-- The raw bearer credential is never persisted.
-- Only its SHA-256 digest is retained on the exact invitation aggregate.

ALTER TABLE "FrenchWardLoiInvitation"
ADD COLUMN "credentialHash" TEXT,
ADD COLUMN "credentialIssuedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "FrenchWardLoiInvitation_credentialHash_key"
ON "FrenchWardLoiInvitation"("credentialHash");
