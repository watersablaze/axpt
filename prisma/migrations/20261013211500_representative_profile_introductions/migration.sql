-- CreateEnum
CREATE TYPE "RepresentativeProfileDeliveryStatus" AS ENUM ('QUEUED', 'SENDING', 'ACCEPTED', 'FAILED', 'DELIVERY_UNKNOWN', 'LOGGED_ONLY');

-- CreateTable
CREATE TABLE "RepresentativeProfileIntroduction" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "resourceReleaseId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientOrganization" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "resourceReference" TEXT NOT NULL,
    "resourceVersion" INTEGER NOT NULL,
    "policy" TEXT NOT NULL,
    "authoritySnapshot" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "recipientDeliveryStatus" "RepresentativeProfileDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "recipientMessageId" TEXT,
    "recipientAttemptedAt" TIMESTAMP(3),
    "recipientDeliveryError" TEXT,
    "adminDeliveryStatus" "RepresentativeProfileDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "adminRecipients" TEXT[],
    "adminMessageId" TEXT,
    "adminAttemptedAt" TIMESTAMP(3),
    "adminDeliveryError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepresentativeProfileIntroduction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepresentativeProfileIntroduction_grantId_key" ON "RepresentativeProfileIntroduction"("grantId");

-- CreateIndex
CREATE INDEX "RepresentativeProfileIntroduction_participantId_createdAt_idx" ON "RepresentativeProfileIntroduction"("participantId", "createdAt");

-- CreateIndex
CREATE INDEX "RepresentativeProfileIntroduction_recipientEmail_resourceRe_idx" ON "RepresentativeProfileIntroduction"("recipientEmail", "resourceReference", "resourceVersion");

-- CreateIndex
CREATE INDEX "RepresentativeProfileIntroduction_recipientDeliveryStatus_c_idx" ON "RepresentativeProfileIntroduction"("recipientDeliveryStatus", "createdAt");

-- CreateIndex
CREATE INDEX "RepresentativeProfileIntroduction_adminDeliveryStatus_creat_idx" ON "RepresentativeProfileIntroduction"("adminDeliveryStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RepresentativeProfileIntroduction_actorUserId_idempotencyKe_key" ON "RepresentativeProfileIntroduction"("actorUserId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "RepresentativeProfileIntroduction" ADD CONSTRAINT "RepresentativeProfileIntroduction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeProfileIntroduction" ADD CONSTRAINT "RepresentativeProfileIntroduction_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeProfileIntroduction" ADD CONSTRAINT "RepresentativeProfileIntroduction_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "RepresentativeProgramParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeProfileIntroduction" ADD CONSTRAINT "RepresentativeProfileIntroduction_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "RepresentativeProgramAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeProfileIntroduction" ADD CONSTRAINT "RepresentativeProfileIntroduction_resourceReleaseId_fkey" FOREIGN KEY ("resourceReleaseId") REFERENCES "CommercialUtilityPackResourceRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeProfileIntroduction" ADD CONSTRAINT "RepresentativeProfileIntroduction_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "InstitutionalAccessGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
