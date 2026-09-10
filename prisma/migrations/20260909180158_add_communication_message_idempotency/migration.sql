-- Communications message submission identity.
--
-- Existing messages predate client submission IDs.
-- Their durable message IDs provide collision-free legacy identities.

ALTER TABLE "CommunicationMessage"
ADD COLUMN "clientMessageId" TEXT;

UPDATE "CommunicationMessage"
SET "clientMessageId" = 'legacy:' || "id"
WHERE "clientMessageId" IS NULL;

ALTER TABLE "CommunicationMessage"
ALTER COLUMN "clientMessageId" SET NOT NULL;

CREATE UNIQUE INDEX
"CommunicationMessage_conversationId_senderUserId_clientMessageId_key"
ON "CommunicationMessage"(
  "conversationId",
  "senderUserId",
  "clientMessageId"
);
