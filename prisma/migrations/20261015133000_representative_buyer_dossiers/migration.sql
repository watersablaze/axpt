-- AlterEnum
ALTER TYPE "InstitutionalAccessScope" ADD VALUE 'SOURCE_AUTHORITY_VIEW';

-- CreateTable
CREATE TABLE "RepresentativeBuyerDossier" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientOrganization" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "policy" TEXT NOT NULL,
    "reviewHash" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "authoritySnapshot" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
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

    CONSTRAINT "RepresentativeBuyerDossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepresentativeBuyerDossierItem" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "resourceReleaseId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "resourceReference" TEXT NOT NULL,
    "resourceVersion" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "recipientContentHash" TEXT NOT NULL,
    "canDownload" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepresentativeBuyerDossierItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepresentativeBuyerDossier_participantId_createdAt_idx" ON "RepresentativeBuyerDossier"("participantId", "createdAt");

-- CreateIndex
CREATE INDEX "RepresentativeBuyerDossier_recipientUserId_expiresAt_idx" ON "RepresentativeBuyerDossier"("recipientUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "RepresentativeBuyerDossier_recipientDeliveryStatus_createdA_idx" ON "RepresentativeBuyerDossier"("recipientDeliveryStatus", "createdAt");

-- CreateIndex
CREATE INDEX "RepresentativeBuyerDossier_adminDeliveryStatus_createdAt_idx" ON "RepresentativeBuyerDossier"("adminDeliveryStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RepresentativeBuyerDossier_actorUserId_idempotencyKey_key" ON "RepresentativeBuyerDossier"("actorUserId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "RepresentativeBuyerDossierItem_grantId_key" ON "RepresentativeBuyerDossierItem"("grantId");

-- CreateIndex
CREATE UNIQUE INDEX "RepresentativeBuyerDossierItem_dossierId_resourceReleaseId_key" ON "RepresentativeBuyerDossierItem"("dossierId", "resourceReleaseId");

-- CreateIndex
CREATE UNIQUE INDEX "RepresentativeBuyerDossierItem_dossierId_resourceReference_key" ON "RepresentativeBuyerDossierItem"("dossierId", "resourceReference");

-- AddForeignKey
ALTER TABLE "RepresentativeBuyerDossier" ADD CONSTRAINT "RepresentativeBuyerDossier_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeBuyerDossier" ADD CONSTRAINT "RepresentativeBuyerDossier_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeBuyerDossier" ADD CONSTRAINT "RepresentativeBuyerDossier_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "RepresentativeProgramParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeBuyerDossier" ADD CONSTRAINT "RepresentativeBuyerDossier_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "RepresentativeProgramAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeBuyerDossierItem" ADD CONSTRAINT "RepresentativeBuyerDossierItem_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "RepresentativeBuyerDossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeBuyerDossierItem" ADD CONSTRAINT "RepresentativeBuyerDossierItem_resourceReleaseId_fkey" FOREIGN KEY ("resourceReleaseId") REFERENCES "CommercialUtilityPackResourceRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeBuyerDossierItem" ADD CONSTRAINT "RepresentativeBuyerDossierItem_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "InstitutionalAccessGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
