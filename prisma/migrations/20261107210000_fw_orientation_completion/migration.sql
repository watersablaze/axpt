CREATE TABLE "FrenchWardOrientationCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orientationVersion" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrenchWardOrientationCompletion_pkey"
      PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
  "FrenchWardOrientationCompletion_userId_orientationVersion_key"
ON "FrenchWardOrientationCompletion"
  ("userId", "orientationVersion");

CREATE INDEX
  "FrenchWardOrientationCompletion_orientationVersion_completedAt_idx"
ON "FrenchWardOrientationCompletion"
  ("orientationVersion", "completedAt");

ALTER TABLE "FrenchWardOrientationCompletion"
ADD CONSTRAINT "FrenchWardOrientationCompletion_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
