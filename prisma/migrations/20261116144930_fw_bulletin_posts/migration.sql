CREATE TABLE "FrenchWardBulletinPost" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrenchWardBulletinPost_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FrenchWardBulletinPost_authorUserId_fkey"
        FOREIGN KEY ("authorUserId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "FrenchWardBulletinPost_publishedAt_id_idx"
    ON "FrenchWardBulletinPost"("publishedAt", "id");
