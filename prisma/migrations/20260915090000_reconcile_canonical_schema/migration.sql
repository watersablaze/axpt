-- CreateEnum
CREATE TYPE "OpportunitySource" AS ENUM ('EMAIL', 'WHATSAPP', 'PHONE', 'REFERRAL', 'LOI', 'WEBSITE', 'INTERNAL', 'DIRECT', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('INTAKE', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROMOTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TransactionState" AS ENUM ('INTAKE_PENDING', 'KYC_REVIEW', 'SPA_DRAFTING', 'SPA_EXECUTED', 'ESCROW_PENDING', 'ESCROW_FUNDED', 'PAYMENT_INSTRUCTION_PENDING', 'PAYMENT_CONFIRMED', 'CRYPTO_WALLET_CONFIRMATION', 'CRYPTO_RECEIVED', 'FINANCIAL_INSTRUMENT_PENDING', 'FINANCIAL_INSTRUMENT_CONFIRMED', 'REFINERY_COORDINATION', 'TREASURY_PENDING', 'EXPORT_RELEASED', 'EXPORT_ACTIVE', 'IN_TRANSIT', 'REFINERY_INTAKE', 'REFINERY_ASSAY', 'ASSAY_PENDING', 'SETTLEMENT_PENDING', 'SETTLED', 'BLOCKED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InstrumentType" AS ENUM ('SPA', 'ANNEX_A_DELIVERY', 'ANNEX_B_SETTLEMENT', 'ANNEX_C_REFINERY', 'ANNEX_D_COMPLIANCE', 'ANNEX_E_PROCEDURE', 'ANNEX_F_FINANCIAL_INSTRUMENT', 'ANNEX_G_COMPENSATION_SCHEDULE', 'EXPORT_RELEASE_NOTICE', 'EXPORT_ACTIVATION_NOTICE', 'ESCROW_SETUP_INSTRUCTION', 'PAYMENT_INSTRUCTION_SHEET', 'PAYMENT_CONFIRMATION', 'CRYPTO_SETTLEMENT_INSTRUCTION', 'WALLET_CONFIRMATION_SHEET', 'CRYPTO_RECEIPT_EVIDENCE', 'FINANCIAL_INSTRUMENT_REVIEW_SHEET', 'FINANCIAL_INSTRUMENT_EVIDENCE', 'REFINERY_COORDINATION_SHEET');

-- CreateEnum
CREATE TYPE "InstrumentStatus" AS ENUM ('TEMPLATE', 'DRAFT', 'ACTIVE', 'EXECUTED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PartyRole" AS ENUM ('SELLER', 'BUYER', 'COORDINATOR', 'COOPERATIVE', 'REFINERY', 'TREASURY_CONTACT', 'LOGISTICS_CONTACT');

-- CreateEnum
CREATE TYPE "DossierBankCoordinateRole" AS ENUM ('BUYER_REMITTING', 'SELLER_RECEIVING', 'ESCROW_TRUST', 'INTERMEDIARY', 'OTHER');

-- CreateEnum
CREATE TYPE "DossierReleaseConditionStatus" AS ENUM ('PENDING', 'SATISFIED', 'WAIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "DossierIssuanceApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

-- CreateTable
CREATE TABLE "TransactionIntake" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submitterName" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "submitterPhone" TEXT,
    "submitterCompany" TEXT,
    "submitterCountry" TEXT,
    "submitterRole" TEXT NOT NULL,
    "representedPartyType" TEXT,
    "representedPartyName" TEXT,
    "authorizationStatus" TEXT,
    "program" TEXT,
    "transactionType" TEXT,
    "commodity" TEXT,
    "quantity" TEXT,
    "trialQuantity" TEXT,
    "monthlyQuantity" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "deliveryTerms" TEXT,
    "settlementMethod" TEXT,
    "expectedTimeline" TEXT,
    "buyerName" TEXT,
    "sellerName" TEXT,
    "refineryPreference" TEXT,
    "financialReadiness" TEXT,
    "documentsAvailable" TEXT,
    "supportingNotes" TEXT,
    "referralCode" TEXT,
    "referredByName" TEXT,
    "referredByCompany" TEXT,
    "referredByEmail" TEXT,
    "referredByPhone" TEXT,
    "referredByRole" TEXT,
    "referralConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "compensationExpectation" TEXT,
    "declarationAccuracy" BOOLEAN NOT NULL DEFAULT false,
    "declarationNoObligation" BOOLEAN NOT NULL DEFAULT false,
    "declarationNoCommission" BOOLEAN NOT NULL DEFAULT false,
    "internalNotes" TEXT,
    "promotedOpportunityId" TEXT,
    "promotedAt" TIMESTAMP(3),
    "promotedBy" TEXT,
    "sourceUrl" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionIntakeEvent" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actor" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionIntakeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDossier" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "state" "TransactionState" NOT NULL DEFAULT 'INTAKE_PENDING',
    "commodity" TEXT,
    "origin" TEXT,
    "quantityKg" DECIMAL(18,6),
    "refinery" TEXT,
    "settlement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionDossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierIssuanceApproval" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "instrumentType" "InstrumentType" NOT NULL,
    "instrumentId" TEXT,
    "status" "DossierIssuanceApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierIssuanceApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDossierReleaseCondition" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT,
    "responsibleParty" TEXT,
    "evidenceRequired" TEXT,
    "status" "DossierReleaseConditionStatus" NOT NULL DEFAULT 'PENDING',
    "satisfiedBy" TEXT,
    "satisfiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionDossierReleaseCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDossierBankCoordinate" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "role" "DossierBankCoordinateRole" NOT NULL,
    "label" TEXT NOT NULL,
    "accountName" TEXT,
    "bankName" TEXT,
    "bankAddress" TEXT,
    "accountNumber" TEXT,
    "routingNumber" TEXT,
    "swiftCode" TEXT,
    "iban" TEXT,
    "currency" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionDossierBankCoordinate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDossierTerms" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "settlementMethod" TEXT,
    "financialInstrumentType" TEXT,
    "issuingInstitution" TEXT,
    "instrumentAmountOrCoverage" TEXT,
    "validityPeriod" TEXT,
    "paymentTrigger" TEXT,
    "beneficiary" TEXT,
    "sellerSideCompensation" TEXT,
    "buyerSideCompensation" TEXT,
    "compensationPayer" TEXT,
    "compensationPayees" TEXT,
    "compensationPayoutTrigger" TEXT,
    "compensationPaymentMethod" TEXT,
    "compensationAuthorizationStatus" TEXT,
    "compensationConfidentialityNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionDossierTerms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDossierParty" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "role" "PartyRole" NOT NULL,
    "legalName" TEXT NOT NULL,
    "representative" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionDossierParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDossierInstrument" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "type" "InstrumentType" NOT NULL,
    "status" "InstrumentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionDossierInstrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDossierEvent" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromState" "TransactionState",
    "toState" "TransactionState",
    "message" TEXT NOT NULL,
    "actor" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionDossierEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveIncident" (
    "id" TEXT NOT NULL,
    "incidentKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "streamType" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "latestAt" TIMESTAMP(3) NOT NULL,
    "eventCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentActionLog" (
    "id" TEXT NOT NULL,
    "incidentKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "operatorId" TEXT,
    "operatorEmail" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierApprovalRequirement" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "transitionKey" TEXT NOT NULL,
    "requiredRole" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierApprovalRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierApprovalGrant" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "operatorEmail" TEXT NOT NULL,
    "operatorId" TEXT,
    "roleKey" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'APPROVED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierApprovalGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" "OpportunitySource" NOT NULL DEFAULT 'DIRECT',
    "status" "OpportunityStatus" NOT NULL DEFAULT 'INTAKE',
    "commodity" TEXT,
    "buyerName" TEXT,
    "sellerName" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "quantityKg" TEXT,
    "notes" TEXT,
    "dossierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "promotedDossierId" TEXT,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityEvent" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actor" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionIntake_reference_key" ON "TransactionIntake"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionIntake_promotedOpportunityId_key" ON "TransactionIntake"("promotedOpportunityId");

-- CreateIndex
CREATE INDEX "TransactionIntake_reference_idx" ON "TransactionIntake"("reference");

-- CreateIndex
CREATE INDEX "TransactionIntake_status_idx" ON "TransactionIntake"("status");

-- CreateIndex
CREATE INDEX "TransactionIntake_submitterEmail_idx" ON "TransactionIntake"("submitterEmail");

-- CreateIndex
CREATE INDEX "TransactionIntake_referralCode_idx" ON "TransactionIntake"("referralCode");

-- CreateIndex
CREATE INDEX "TransactionIntake_commodity_idx" ON "TransactionIntake"("commodity");

-- CreateIndex
CREATE INDEX "TransactionIntake_program_idx" ON "TransactionIntake"("program");

-- CreateIndex
CREATE INDEX "TransactionIntake_promotedAt_idx" ON "TransactionIntake"("promotedAt");

-- CreateIndex
CREATE INDEX "TransactionIntake_createdAt_idx" ON "TransactionIntake"("createdAt");

-- CreateIndex
CREATE INDEX "TransactionIntakeEvent_intakeId_idx" ON "TransactionIntakeEvent"("intakeId");

-- CreateIndex
CREATE INDEX "TransactionIntakeEvent_eventType_idx" ON "TransactionIntakeEvent"("eventType");

-- CreateIndex
CREATE INDEX "TransactionIntakeEvent_createdAt_idx" ON "TransactionIntakeEvent"("createdAt");

-- CreateIndex
CREATE INDEX "TransactionIntakeEvent_toStatus_idx" ON "TransactionIntakeEvent"("toStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionDossier_reference_key" ON "TransactionDossier"("reference");

-- CreateIndex
CREATE INDEX "DossierIssuanceApproval_dossierId_idx" ON "DossierIssuanceApproval"("dossierId");

-- CreateIndex
CREATE INDEX "DossierIssuanceApproval_instrumentType_idx" ON "DossierIssuanceApproval"("instrumentType");

-- CreateIndex
CREATE INDEX "DossierIssuanceApproval_status_idx" ON "DossierIssuanceApproval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DossierIssuanceApproval_dossierId_instrumentType_key" ON "DossierIssuanceApproval"("dossierId", "instrumentType");

-- CreateIndex
CREATE INDEX "TransactionDossierReleaseCondition_dossierId_idx" ON "TransactionDossierReleaseCondition"("dossierId");

-- CreateIndex
CREATE INDEX "TransactionDossierReleaseCondition_status_idx" ON "TransactionDossierReleaseCondition"("status");

-- CreateIndex
CREATE INDEX "TransactionDossierBankCoordinate_dossierId_idx" ON "TransactionDossierBankCoordinate"("dossierId");

-- CreateIndex
CREATE INDEX "TransactionDossierBankCoordinate_role_idx" ON "TransactionDossierBankCoordinate"("role");

-- CreateIndex
CREATE INDEX "TransactionDossierBankCoordinate_verificationStatus_idx" ON "TransactionDossierBankCoordinate"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionDossierTerms_dossierId_key" ON "TransactionDossierTerms"("dossierId");

-- CreateIndex
CREATE INDEX "TransactionDossierTerms_settlementMethod_idx" ON "TransactionDossierTerms"("settlementMethod");

-- CreateIndex
CREATE INDEX "TransactionDossierTerms_financialInstrumentType_idx" ON "TransactionDossierTerms"("financialInstrumentType");

-- CreateIndex
CREATE INDEX "TransactionDossierParty_dossierId_idx" ON "TransactionDossierParty"("dossierId");

-- CreateIndex
CREATE INDEX "TransactionDossierParty_role_idx" ON "TransactionDossierParty"("role");

-- CreateIndex
CREATE INDEX "TransactionDossierInstrument_dossierId_idx" ON "TransactionDossierInstrument"("dossierId");

-- CreateIndex
CREATE INDEX "TransactionDossierInstrument_type_idx" ON "TransactionDossierInstrument"("type");

-- CreateIndex
CREATE INDEX "TransactionDossierInstrument_status_idx" ON "TransactionDossierInstrument"("status");

-- CreateIndex
CREATE INDEX "TransactionDossierEvent_dossierId_idx" ON "TransactionDossierEvent"("dossierId");

-- CreateIndex
CREATE INDEX "TransactionDossierEvent_eventType_idx" ON "TransactionDossierEvent"("eventType");

-- CreateIndex
CREATE INDEX "TransactionDossierEvent_createdAt_idx" ON "TransactionDossierEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveIncident_incidentKey_key" ON "ActiveIncident"("incidentKey");

-- CreateIndex
CREATE INDEX "IncidentActionLog_incidentKey_idx" ON "IncidentActionLog"("incidentKey");

-- CreateIndex
CREATE INDEX "IncidentActionLog_action_idx" ON "IncidentActionLog"("action");

-- CreateIndex
CREATE INDEX "IncidentActionLog_createdAt_idx" ON "IncidentActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "DossierApprovalRequirement_dossierId_idx" ON "DossierApprovalRequirement"("dossierId");

-- CreateIndex
CREATE INDEX "DossierApprovalRequirement_transitionKey_idx" ON "DossierApprovalRequirement"("transitionKey");

-- CreateIndex
CREATE UNIQUE INDEX "DossierApprovalRequirement_dossierId_transitionKey_required_key" ON "DossierApprovalRequirement"("dossierId", "transitionKey", "requiredRole");

-- CreateIndex
CREATE INDEX "DossierApprovalGrant_requirementId_idx" ON "DossierApprovalGrant"("requirementId");

-- CreateIndex
CREATE INDEX "DossierApprovalGrant_operatorEmail_idx" ON "DossierApprovalGrant"("operatorEmail");

-- CreateIndex
CREATE UNIQUE INDEX "DossierApprovalGrant_requirementId_operatorEmail_key" ON "DossierApprovalGrant"("requirementId", "operatorEmail");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE INDEX "Opportunity_source_idx" ON "Opportunity"("source");

-- CreateIndex
CREATE INDEX "Opportunity_dossierId_idx" ON "Opportunity"("dossierId");

-- CreateIndex
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt");

-- CreateIndex
CREATE INDEX "OpportunityEvent_opportunityId_idx" ON "OpportunityEvent"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityEvent_type_idx" ON "OpportunityEvent"("type");

-- CreateIndex
CREATE INDEX "OpportunityEvent_actor_idx" ON "OpportunityEvent"("actor");

-- CreateIndex
CREATE INDEX "OpportunityEvent_createdAt_idx" ON "OpportunityEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "TransactionIntake" ADD CONSTRAINT "TransactionIntake_promotedOpportunityId_fkey" FOREIGN KEY ("promotedOpportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionIntakeEvent" ADD CONSTRAINT "TransactionIntakeEvent_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "TransactionIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierIssuanceApproval" ADD CONSTRAINT "DossierIssuanceApproval_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierReleaseCondition" ADD CONSTRAINT "TransactionDossierReleaseCondition_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierBankCoordinate" ADD CONSTRAINT "TransactionDossierBankCoordinate_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierTerms" ADD CONSTRAINT "TransactionDossierTerms_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierParty" ADD CONSTRAINT "TransactionDossierParty_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierInstrument" ADD CONSTRAINT "TransactionDossierInstrument_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierEvent" ADD CONSTRAINT "TransactionDossierEvent_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierApprovalRequirement" ADD CONSTRAINT "DossierApprovalRequirement_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierApprovalGrant" ADD CONSTRAINT "DossierApprovalGrant_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DossierApprovalRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_promotedDossierId_fkey" FOREIGN KEY ("promotedDossierId") REFERENCES "TransactionDossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityEvent" ADD CONSTRAINT "OpportunityEvent_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
