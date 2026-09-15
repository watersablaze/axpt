-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('SPA_DRAFT', 'SPA_FINAL', 'BUYER_PASSPORT', 'SELLER_PASSPORT', 'BUYER_KYC', 'SELLER_KYC', 'COMPANY_REGISTRATION', 'PROOF_OF_FUNDS', 'ASSAY_REPORT', 'COMMERCIAL_INVOICE', 'ESCROW_INSTRUCTIONS', 'BANK_COORDINATES', 'SHIPPING_DOCS', 'EXPORT_DOCS', 'POP_VIDEO_CONFIRMATION', 'REFINERY_CONFIRMATION', 'OTHER');

-- AlterEnum
ALTER TYPE "CaseMode" ADD VALUE 'GOLD_SPA_PROTOCOL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CasePartyRole" ADD VALUE 'BUYER';
ALTER TYPE "CasePartyRole" ADD VALUE 'SELLER';
ALTER TYPE "CasePartyRole" ADD VALUE 'BUYER_MANDATE';
ALTER TYPE "CasePartyRole" ADD VALUE 'SELLER_MANDATE';
ALTER TYPE "CasePartyRole" ADD VALUE 'ESCROW_AGENT';
ALTER TYPE "CasePartyRole" ADD VALUE 'INTERNAL_OPERATOR';
ALTER TYPE "CasePartyRole" ADD VALUE 'REFINERY';
ALTER TYPE "CasePartyRole" ADD VALUE 'CUSTOMS_AGENT';
ALTER TYPE "CasePartyRole" ADD VALUE 'LOGISTICS_AGENT';

-- AlterEnum
ALTER TYPE "CaseWorkflowType" ADD VALUE 'GOLD_SPA';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GateType" ADD VALUE 'INTAKE';
ALTER TYPE "GateType" ADD VALUE 'KYC';
ALTER TYPE "GateType" ADD VALUE 'COMPLIANCE';
ALTER TYPE "GateType" ADD VALUE 'COMMERCIAL';
ALTER TYPE "GateType" ADD VALUE 'SIGNATURE';
ALTER TYPE "GateType" ADD VALUE 'DOCUMENT';
ALTER TYPE "GateType" ADD VALUE 'ESCROW';
ALTER TYPE "GateType" ADD VALUE 'FUNDING';
ALTER TYPE "GateType" ADD VALUE 'ASSAY';
ALTER TYPE "GateType" ADD VALUE 'RELEASE';
ALTER TYPE "GateType" ADD VALUE 'COMPLETION';

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "caratsText" TEXT,
ADD COLUMN     "commodity" TEXT,
ADD COLUMN     "commodityForm" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "isPrincipalBuyerCase" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notesInternal" TEXT,
ADD COLUMN     "originCountry" TEXT,
ADD COLUMN     "pricingFormula" TEXT,
ADD COLUMN     "protocolTemplate" TEXT,
ADD COLUMN     "purityText" TEXT,
ADD COLUMN     "quantityText" TEXT,
ADD COLUMN     "titleTransferRule" TEXT,
ADD COLUMN     "transactionType" TEXT;

-- AlterTable
ALTER TABLE "OperatorProfile" ADD COLUMN     "averageDecisionLatency" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "interventionAcceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Case_protocolTemplate_idx" ON "Case"("protocolTemplate");
