ALTER TABLE "RepresentativeBuyerDossier" ADD COLUMN "loiAccessGrantId" TEXT;
CREATE UNIQUE INDEX "RepresentativeBuyerDossier_loiAccessGrantId_key" ON "RepresentativeBuyerDossier"("loiAccessGrantId");
ALTER TABLE "RepresentativeBuyerDossier" ADD CONSTRAINT "RepresentativeBuyerDossier_loiAccessGrantId_fkey" FOREIGN KEY ("loiAccessGrantId") REFERENCES "InstitutionalAccessGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
