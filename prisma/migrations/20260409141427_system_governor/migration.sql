-- CreateTable
CREATE TABLE "SystemGovernor" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "currentState" TEXT NOT NULL,
    "lastTransition" TIMESTAMP(3) NOT NULL,
    "holdUntil" TIMESTAMP(3),

    CONSTRAINT "SystemGovernor_pkey" PRIMARY KEY ("id")
);
