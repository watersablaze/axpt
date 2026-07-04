-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('SPA_DRAFT', 'SPA_FINAL', 'BUYER_PASSPORT', 'SELLER_PASSPORT', 'BUYER_KYC', 'SELLER_KYC', 'COMPANY_REGISTRATION', 'PROOF_OF_FUNDS', 'ASSAY_REPORT', 'COMMERCIAL_INVOICE', 'ESCROW_INSTRUCTIONS', 'BANK_COORDINATES', 'SHIPPING_DOCS', 'EXPORT_DOCS', 'POP_VIDEO_CONFIRMATION', 'REFINERY_CONFIRMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "CaseEventType" AS ENUM ('CASE_CREATED', 'PARTY_ADDED', 'ARTIFACT_UPLOADED', 'GATE_ACTIVATED', 'GATE_PASSED', 'GATE_FAILED', 'CASE_COMPLETED');

-- CreateEnum
CREATE TYPE "CaseMode" AS ENUM ('COORDINATION_ONLY', 'FULL_ESCROW', 'GOLD_SPA_PROTOCOL');

-- CreateEnum
CREATE TYPE "CasePartyRole" AS ENUM ('OWNER', 'PARTICIPANT', 'VERIFIER', 'FUNDER', 'ARBITER', 'COUNCIL', 'BUYER', 'SELLER', 'BUYER_MANDATE', 'SELLER_MANDATE', 'ESCROW_AGENT', 'INTERNAL_OPERATOR', 'REFINERY', 'CUSTOMS_AGENT', 'LOGISTICS_AGENT');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_REVIEW', 'ACTIVE', 'ESCROW_INITIATED', 'COMPLETED', 'CANCELLED', 'ARCHIVED', 'ESCROW_HOLD', 'ESCROW_DISPUTED');

-- CreateEnum
CREATE TYPE "CaseWorkflowType" AS ENUM ('COORDINATION', 'ESCROW', 'FUNDING', 'GOVERNANCE', 'ARCHIVE', 'ONBOARDING', 'GOLD_SPA');

-- CreateEnum
CREATE TYPE "ChainMirrorJobStatus" AS ENUM ('PENDING', 'CLAIMED', 'SUBMITTED', 'CONFIRMED', 'RETRYABLE', 'FAILED', 'DEAD_LETTER', 'SUBMITTING');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('GENERAL', 'OFFER', 'CONTRACT', 'ESCROW_AGREEMENT', 'INVOICE', 'PROOF', 'GOVERNANCE_RECORD');

-- CreateEnum
CREATE TYPE "DocumentSigningStatus" AS ENUM ('UNSIGNED', 'PARTIALLY_SIGNED', 'SIGNED');

-- CreateEnum
CREATE TYPE "DossierBankCoordinateRole" AS ENUM ('BUYER_REMITTING', 'SELLER_RECEIVING', 'ESCROW_TRUST', 'INTERMEDIARY', 'OTHER');

-- CreateEnum
CREATE TYPE "DossierIssuanceApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "DossierReleaseConditionStatus" AS ENUM ('PENDING', 'SATISFIED', 'WAIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "GateStatus" AS ENUM ('PENDING', 'ACTIVE', 'VERIFIED', 'REJECTED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "GateType" AS ENUM ('MANUAL', 'ARTIFACT_REQUIRED', 'SIGNATURE_REQUIRED', 'ESCROW_LOCK', 'ORACLE_CHECK', 'INTAKE', 'KYC', 'COMPLIANCE', 'COMMERCIAL', 'SIGNATURE', 'DOCUMENT', 'ESCROW', 'FUNDING', 'ASSAY', 'RELEASE', 'COMPLETION');

-- CreateEnum
CREATE TYPE "InitiativeCategory" AS ENUM ('ENERGY', 'FINTECH', 'DATA', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "InitiativeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InstrumentStatus" AS ENUM ('TEMPLATE', 'DRAFT', 'ACTIVE', 'EXECUTED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InstrumentType" AS ENUM ('SPA', 'ANNEX_A_DELIVERY', 'ANNEX_B_SETTLEMENT', 'ANNEX_C_REFINERY', 'ANNEX_D_COMPLIANCE', 'ANNEX_E_PROCEDURE', 'EXPORT_RELEASE_NOTICE', 'EXPORT_ACTIVATION_NOTICE', 'ANNEX_F_FINANCIAL_INSTRUMENT', 'ANNEX_G_COMPENSATION_SCHEDULE', 'ESCROW_SETUP_INSTRUCTION', 'PAYMENT_INSTRUCTION_SHEET', 'PAYMENT_CONFIRMATION', 'CRYPTO_SETTLEMENT_INSTRUCTION', 'WALLET_CONFIRMATION_SHEET', 'CRYPTO_RECEIPT_EVIDENCE', 'FINANCIAL_INSTRUMENT_REVIEW_SHEET', 'FINANCIAL_INSTRUMENT_EVIDENCE', 'REFINERY_COORDINATION_SHEET');

-- CreateEnum
CREATE TYPE "ItemAudience" AS ENUM ('ALL', 'SELLER', 'BUYER', 'INTERNAL');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('TREASURY', 'USER', 'EXTERNAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "OperatorArchetype" AS ENUM ('EXECUTOR', 'GUARDIAN', 'ANALYST', 'DIPLOMAT');

-- CreateEnum
CREATE TYPE "OpportunitySource" AS ENUM ('EMAIL', 'WHATSAPP', 'REFERRAL', 'DIRECT', 'OTHER', 'PHONE', 'LOI', 'WEBSITE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('INTAKE', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROMOTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PartyRole" AS ENUM ('SELLER', 'BUYER', 'COORDINATOR', 'COOPERATIVE', 'REFINERY', 'TREASURY_CONTACT', 'LOGISTICS_CONTACT');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'FUNDED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('AXG', 'NMP', 'USD', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionState" AS ENUM ('INTAKE_PENDING', 'KYC_REVIEW', 'SPA_DRAFTING', 'SPA_EXECUTED', 'ESCROW_PENDING', 'ESCROW_FUNDED', 'TREASURY_PENDING', 'EXPORT_RELEASED', 'EXPORT_ACTIVE', 'IN_TRANSIT', 'REFINERY_INTAKE', 'REFINERY_ASSAY', 'ASSAY_PENDING', 'SETTLEMENT_PENDING', 'SETTLED', 'BLOCKED', 'CANCELLED', 'CLOSED', 'PAYMENT_INSTRUCTION_PENDING', 'PAYMENT_CONFIRMED', 'CRYPTO_WALLET_CONFIRMATION', 'CRYPTO_RECEIVED', 'FINANCIAL_INSTRUMENT_PENDING', 'FINANCIAL_INSTRUMENT_CONFIRMED', 'REFINERY_COORDINATION');

-- CreateTable
CREATE TABLE "AccessCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "humanCode" TEXT,
    "partner" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "email" TEXT,
    "docs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "displayName" TEXT,
    "greeting" TEXT,
    "popupMessage" TEXT,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "lastUsedIp" TEXT,

    CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hash" TEXT,
    "url" TEXT,
    "uploadedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'MISSING',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenType" "TokenType",
    "tokenId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountBaseUnits" DECIMAL(78,0),
    "assetCode" TEXT,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainWallet" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "network" TEXT,

    CONSTRAINT "BlockchainWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadaWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CadaWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "jurisdiction" TEXT,
    "referenceCode" TEXT,
    "workflowType" "CaseWorkflowType" NOT NULL DEFAULT 'COORDINATION',
    "mode" "CaseMode" NOT NULL DEFAULT 'COORDINATION_ONLY',
    "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "openedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "caratsText" TEXT,
    "commodity" TEXT,
    "commodityForm" TEXT,
    "currency" TEXT,
    "destination" TEXT,
    "isPrincipalBuyerCase" BOOLEAN NOT NULL DEFAULT false,
    "notesInternal" TEXT,
    "originCountry" TEXT,
    "pricingFormula" TEXT,
    "protocolTemplate" TEXT,
    "purityText" TEXT,
    "quantityText" TEXT,
    "titleTransferRule" TEXT,
    "transactionType" TEXT,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseArtifact" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storageUrl" TEXT,
    "metadata" JSONB,
    "uploadedById" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "CaseEventType" NOT NULL,
    "payload" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseGate" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "status" "GateStatus" NOT NULL DEFAULT 'PENDING',
    "activatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseGate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseParty" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "CasePartyRole" NOT NULL,
    "label" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseReadModel" (
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "workflowType" TEXT,
    "currentGateName" TEXT,
    "nextActionLabel" TEXT,
    "responsibleRole" TEXT,
    "escrowStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentStage" TEXT,

    CONSTRAINT "CaseReadModel_pkey" PRIMARY KEY ("caseId")
);

-- CreateTable
CREATE TABLE "ChainMirrorCursor" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "lastBlock" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,

    CONSTRAINT "ChainMirrorCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainMirrorEvent" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT,
    "chainTimestamp" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "walletEventId" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "amountBaseUnits" DECIMAL(78,0) NOT NULL,

    CONSTRAINT "ChainMirrorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainMirrorJob" (
    "id" TEXT NOT NULL,
    "walletEventId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "amountBaseUnits" DECIMAL(78,0) NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "status" "ChainMirrorJobStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "claimOwner" TEXT,
    "claimedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "submittedTxHash" TEXT,
    "submittedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "deadLetteredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "lastHeartbeatAt" TIMESTAMP(3),
    "submissionStartedAt" TIMESTAMP(3),

    CONSTRAINT "ChainMirrorJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainSyncState" (
    "id" TEXT NOT NULL DEFAULT 'mirror',
    "lastBlock" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChainSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircuitEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircuitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractInteractionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "result" JSONB,
    "txHash" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractInteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilElder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CouncilElder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "councilEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slackWebhookUrl" TEXT,
    "fromEmail" TEXT,
    "provider" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouncilSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturalProof" (
    "id" TEXT NOT NULL,
    "smartContractId" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "medium" TEXT,
    "statement" TEXT,
    "ipfsHash" TEXT,
    "signature" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CulturalProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbPulseLog" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DbPulseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionExplanation" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "scenarioId" TEXT,
    "assetCode" TEXT,
    "systemState" TEXT,
    "summary" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "caseId" TEXT,
    "uploadedById" TEXT,
    "category" "DocumentCategory" NOT NULL DEFAULT 'GENERAL',
    "signingStatus" "DocumentSigningStatus" NOT NULL DEFAULT 'UNSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signatureImageUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEvent" (
    "id" TEXT NOT NULL,
    "streamType" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gate" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ord" INTEGER NOT NULL,
    "gateType" "GateType" NOT NULL DEFAULT 'MANUAL',
    "status" "GateStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Gate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GemIntake" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "desiredGem" TEXT NOT NULL,
    "format" TEXT,
    "size" TEXT,
    "quantity" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "internalNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',

    CONSTRAINT "GemIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceProposal" (
    "id" TEXT NOT NULL,
    "authorElderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quorum" INTEGER,
    "approvalThreshold" INTEGER,
    "votingEndsAt" TIMESTAMP(3),
    "timelockSeconds" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "GovernanceProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceVote" (
    "id" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceVote_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "InitiativeCategory" NOT NULL DEFAULT 'OTHER',
    "status" "InitiativeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "fundingGoal" DECIMAL(18,2),
    "fundingReceived" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeFunding" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InitiativeFunding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeUpdate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "InitiativeUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeRepresentative" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "program" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeRepresentative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentWeightProfile" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "successWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "patternWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetCode" TEXT,
    "systemState" TEXT,

    CONSTRAINT "IntentWeightProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionDecision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "operatorId" TEXT NOT NULL,

    CONSTRAINT "InterventionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentProposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssuedToken" (
    "id" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "docs" TEXT[],
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssuedToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "tokenType" TEXT NOT NULL,
    "type" "LedgerAccountType" NOT NULL,
    "label" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "tokenType" TEXT NOT NULL,
    "walletEventId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "chainTimestamp" TIMESTAMP(3),
    "accountId" TEXT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogoutLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "LogoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "mintedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NFTBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeSyncStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NodeSyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "caseId" TEXT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationReadModel" (
    "id" TEXT NOT NULL,
    "actorRole" TEXT,
    "actorUserId" TEXT,
    "caseId" TEXT,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationReadModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archetype" "OperatorArchetype" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorAlliance" (
    "id" TEXT NOT NULL,
    "operatorAId" TEXT NOT NULL,
    "operatorBId" TEXT NOT NULL,
    "alignmentScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "disagreementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorAlliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorPowerSnapshot" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "power" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorPowerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorProfile" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "totalDecisions" INTEGER NOT NULL DEFAULT 0,
    "approveCount" INTEGER NOT NULL DEFAULT 0,
    "delayCount" INTEGER NOT NULL DEFAULT 0,
    "overrideCount" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "averageDecisionLatency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interventionAcceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctDecisions" INTEGER NOT NULL DEFAULT 0,
    "weightedScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "OperatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorTrust" (
    "id" TEXT NOT NULL,
    "fromOperatorId" TEXT NOT NULL,
    "toOperatorId" TEXT NOT NULL,
    "agreementCount" INTEGER NOT NULL DEFAULT 0,
    "disagreementCount" INTEGER NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "influenceScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "respectScore" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "OperatorTrust_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "tier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "docs" TEXT[],
    "popupMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "viewedDocs" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "authorizedSignatory" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "companyName" TEXT,
    "country" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "passportNo" TEXT,
    "registrationNo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "CasePartyRole" NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinLoginRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PinLoginRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictiveExecution" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "assetCode" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "signalHash" TEXT NOT NULL,

    CONSTRAINT "PredictiveExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "requestedAxg" DECIMAL(18,2) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectReview" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicVerification" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "revokedBy" TEXT,
    "supersededBy" TEXT,

    CONSTRAINT "PublicVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueHistory" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "operatorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,

    CONSTRAINT "QueueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueItem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "urgency" DOUBLE PRECISION NOT NULL,
    "risk" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "QueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueLock" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayAudit" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "originalIntent" TEXT NOT NULL,
    "replayIntent" TEXT,
    "intentChanged" BOOLEAN NOT NULL,
    "addedFactors" JSONB NOT NULL,
    "removedFactors" JSONB NOT NULL,
    "divergenceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplayAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevokedToken" (
    "id" TEXT NOT NULL,
    "rawToken" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'RISK_EVALUATION',
    "userId" TEXT NOT NULL,
    "toUserId" TEXT,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" TEXT,
    "amountBaseUnits" DECIMAL(78,0) NOT NULL,
    "intent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "ip" TEXT,
    "location" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "tokenId" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionActionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "SessionActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "location" TEXT,
    "device" TEXT,
    "action" TEXT NOT NULL DEFAULT 'login',
    "path" TEXT,
    "details" JSONB,

    CONSTRAINT "SessionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "simHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartContract" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "abi" JSONB NOT NULL,
    "network" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "lastSyncedBlock" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Live',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SmartContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "apy" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Stake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyOutcome" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "success" BOOLEAN NOT NULL,
    "impactScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assetCode" TEXT,

    CONSTRAINT "StrategyOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemGovernor" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "currentState" TEXT NOT NULL,
    "lastTransition" TIMESTAMP(3) NOT NULL,
    "holdUntil" TIMESTAMP(3),

    CONSTRAINT "SystemGovernor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemState" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "globalPaused" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "pausedAssets" JSONB,
    "pausedLayers" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 2,
    "description" TEXT,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalSupply" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "approvedById" TEXT,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenAccessLog" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenIssuanceRequest" (
    "id" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "projectId" TEXT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 2,
    "purpose" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "approvedTokenId" TEXT,

    CONSTRAINT "TokenIssuanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tokenType" "TokenType",
    "tokenId" TEXT,
    "txHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountBaseUnits" DECIMAL(78,0),
    "assetCode" TEXT,
    "feeBaseUnits" DECIMAL(78,0),
    "intent" TEXT,
    "idempotencyKey" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
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
    "sourceUrl" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "promotedAt" TIMESTAMP(3),
    "promotedBy" TEXT,
    "promotedOpportunityId" TEXT,

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
CREATE TABLE "TreasuryAction" (
    "id" TEXT NOT NULL,
    "initiatorUserId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "amountBaseUnits" DECIMAL(65,30) NOT NULL,
    "intent" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3),
    "executionError" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryAlertLog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "walletId" TEXT,
    "txHash" TEXT,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryAlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryApproval" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryExecutionQueue" (
    "id" TEXT NOT NULL,
    "treasuryActionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "claimOwner" TEXT,
    "claimedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "retryCount" INTEGER NOT NULL,
    "transactionId" TEXT,

    CONSTRAINT "TreasuryExecutionQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryPulseLog" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reasonsJson" JSONB,
    "totalsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryPulseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "accessTokenHash" TEXT,
    "accessTokenIssuedAt" TIMESTAMP(3),
    "name" TEXT,
    "displayName" TEXT,
    "tier" TEXT,
    "partnerSlug" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "viewedDocs" TEXT[],
    "blockchainWalletId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrustEdge" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "transferCount" INTEGER NOT NULL DEFAULT 0,
    "successfulCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lastTransferAt" TIMESTAMP(3),
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrustEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationItem" (
    "id" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ord" INTEGER,

    CONSTRAINT "VerificationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "axis_journey_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "origin" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmationAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "notes" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "axis_journey_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "from" TEXT,
    "to" TEXT,
    "subject" TEXT,
    "messageId" TEXT,
    "status" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playing_with_neon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL,

    CONSTRAINT "playing_with_neon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_codeHash_key" ON "AccessCode"("codeHash" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveIncident_incidentKey_key" ON "ActiveIncident"("incidentKey" ASC);

-- CreateIndex
CREATE INDEX "Artifact_caseId_type_idx" ON "Artifact"("caseId" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "Balance_assetCode_idx" ON "Balance"("assetCode" ASC);

-- CreateIndex
CREATE INDEX "Balance_tokenId_idx" ON "Balance"("tokenId" ASC);

-- CreateIndex
CREATE INDEX "Balance_tokenType_idx" ON "Balance"("tokenType" ASC);

-- CreateIndex
CREATE INDEX "Balance_userId_idx" ON "Balance"("userId" ASC);

-- CreateIndex
CREATE INDEX "Balance_walletId_idx" ON "Balance"("walletId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Balance_walletId_tokenType_tokenId_key" ON "Balance"("walletId" ASC, "tokenType" ASC, "tokenId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainWallet_address_key" ON "BlockchainWallet"("address" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainWallet_userId_key" ON "BlockchainWallet"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainWallet_walletId_key" ON "BlockchainWallet"("walletId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CadaWaitlist_email_key" ON "CadaWaitlist"("email" ASC);

-- CreateIndex
CREATE INDEX "Case_protocolTemplate_idx" ON "Case"("protocolTemplate" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Case_referenceCode_key" ON "Case"("referenceCode" ASC);

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status" ASC);

-- CreateIndex
CREATE INDEX "Case_workflowType_idx" ON "Case"("workflowType" ASC);

-- CreateIndex
CREATE INDEX "CaseArtifact_caseId_idx" ON "CaseArtifact"("caseId" ASC);

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_idx" ON "CaseEvent"("caseId" ASC);

-- CreateIndex
CREATE INDEX "CaseGate_caseId_idx" ON "CaseGate"("caseId" ASC);

-- CreateIndex
CREATE INDEX "CaseGate_status_idx" ON "CaseGate"("status" ASC);

-- CreateIndex
CREATE INDEX "CaseParty_caseId_idx" ON "CaseParty"("caseId" ASC);

-- CreateIndex
CREATE INDEX "CaseReadModel_status_idx" ON "CaseReadModel"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorCursor_chainId_contract_key" ON "ChainMirrorCursor"("chainId" ASC, "contract" ASC);

-- CreateIndex
CREATE INDEX "ChainMirrorCursor_chainId_idx" ON "ChainMirrorCursor"("chainId" ASC);

-- CreateIndex
CREATE INDEX "ChainMirrorEvent_chainId_blockNumber_idx" ON "ChainMirrorEvent"("chainId" ASC, "blockNumber" ASC);

-- CreateIndex
CREATE INDEX "ChainMirrorEvent_chainId_contract_idx" ON "ChainMirrorEvent"("chainId" ASC, "contract" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorEvent_chainId_txHash_logIndex_key" ON "ChainMirrorEvent"("chainId" ASC, "txHash" ASC, "logIndex" ASC);

-- CreateIndex
CREATE INDEX "ChainMirrorJob_assetCode_idx" ON "ChainMirrorJob"("assetCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorJob_idempotencyKey_key" ON "ChainMirrorJob"("idempotencyKey" ASC);

-- CreateIndex
CREATE INDEX "ChainMirrorJob_status_claimOwner_claimedAt_idx" ON "ChainMirrorJob"("status" ASC, "claimOwner" ASC, "claimedAt" ASC);

-- CreateIndex
CREATE INDEX "ChainMirrorJob_status_nextRetryAt_idx" ON "ChainMirrorJob"("status" ASC, "nextRetryAt" ASC);

-- CreateIndex
CREATE INDEX "ChainMirrorJob_status_submissionStartedAt_idx" ON "ChainMirrorJob"("status" ASC, "submissionStartedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorJob_walletEventId_key" ON "ChainMirrorJob"("walletEventId" ASC);

-- CreateIndex
CREATE INDEX "CircuitEvent_createdAt_idx" ON "CircuitEvent"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ContractInteractionLog_contractId_createdAt_idx" ON "ContractInteractionLog"("contractId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "ContractInteractionLog_userId_createdAt_idx" ON "ContractInteractionLog"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CouncilElder_userId_key" ON "CouncilElder"("userId" ASC);

-- CreateIndex
CREATE INDEX "DecisionExplanation_assetCode_idx" ON "DecisionExplanation"("assetCode" ASC);

-- CreateIndex
CREATE INDEX "DecisionExplanation_intent_createdAt_idx" ON "DecisionExplanation"("intent" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Document_caseId_idx" ON "Document"("caseId" ASC);

-- CreateIndex
CREATE INDEX "DomainEvent_eventType_idx" ON "DomainEvent"("eventType" ASC);

-- CreateIndex
CREATE INDEX "DomainEvent_occurredAt_idx" ON "DomainEvent"("occurredAt" ASC);

-- CreateIndex
CREATE INDEX "DomainEvent_processedAt_idx" ON "DomainEvent"("processedAt" ASC);

-- CreateIndex
CREATE INDEX "DomainEvent_streamType_streamId_idx" ON "DomainEvent"("streamType" ASC, "streamId" ASC);

-- CreateIndex
CREATE INDEX "DossierApprovalGrant_operatorEmail_idx" ON "DossierApprovalGrant"("operatorEmail" ASC);

-- CreateIndex
CREATE INDEX "DossierApprovalGrant_requirementId_idx" ON "DossierApprovalGrant"("requirementId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DossierApprovalGrant_requirementId_operatorEmail_key" ON "DossierApprovalGrant"("requirementId" ASC, "operatorEmail" ASC);

-- CreateIndex
CREATE INDEX "DossierApprovalRequirement_dossierId_idx" ON "DossierApprovalRequirement"("dossierId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DossierApprovalRequirement_dossierId_transitionKey_required_key" ON "DossierApprovalRequirement"("dossierId" ASC, "transitionKey" ASC, "requiredRole" ASC);

-- CreateIndex
CREATE INDEX "DossierApprovalRequirement_transitionKey_idx" ON "DossierApprovalRequirement"("transitionKey" ASC);

-- CreateIndex
CREATE INDEX "DossierIssuanceApproval_dossierId_idx" ON "DossierIssuanceApproval"("dossierId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DossierIssuanceApproval_dossierId_instrumentType_key" ON "DossierIssuanceApproval"("dossierId" ASC, "instrumentType" ASC);

-- CreateIndex
CREATE INDEX "DossierIssuanceApproval_instrumentType_idx" ON "DossierIssuanceApproval"("instrumentType" ASC);

-- CreateIndex
CREATE INDEX "DossierIssuanceApproval_status_idx" ON "DossierIssuanceApproval"("status" ASC);

-- CreateIndex
CREATE INDEX "Escrow_caseId_idx" ON "Escrow"("caseId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Gate_caseId_ord_key" ON "Gate"("caseId" ASC, "ord" ASC);

-- CreateIndex
CREATE INDEX "GovernanceProposal_status_createdAt_idx" ON "GovernanceProposal"("status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "GovernanceProposal_votingEndsAt_idx" ON "GovernanceProposal"("votingEndsAt" ASC);

-- CreateIndex
CREATE INDEX "GovernanceVote_elderId_proposalId_idx" ON "GovernanceVote"("elderId" ASC, "proposalId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceVote_elderId_proposalId_key" ON "GovernanceVote"("elderId" ASC, "proposalId" ASC);

-- CreateIndex
CREATE INDEX "GovernanceVote_proposalId_createdAt_idx" ON "GovernanceVote"("proposalId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "IncidentActionLog_action_idx" ON "IncidentActionLog"("action" ASC);

-- CreateIndex
CREATE INDEX "IncidentActionLog_createdAt_idx" ON "IncidentActionLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "IncidentActionLog_incidentKey_idx" ON "IncidentActionLog"("incidentKey" ASC);

-- CreateIndex
CREATE INDEX "Initiative_slug_idx" ON "Initiative"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Initiative_slug_key" ON "Initiative"("slug" ASC);

-- CreateIndex
CREATE INDEX "Initiative_status_category_idx" ON "Initiative"("status" ASC, "category" ASC);

-- CreateIndex
CREATE INDEX "InitiativeFunding_initiativeId_createdAt_idx" ON "InitiativeFunding"("initiativeId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "InitiativeFunding_userId_idx" ON "InitiativeFunding"("userId" ASC);

-- CreateIndex
CREATE INDEX "InitiativeUpdate_initiativeId_createdAt_idx" ON "InitiativeUpdate"("initiativeId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "IntakeRepresentative_code_idx" ON "IntakeRepresentative"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "IntakeRepresentative_code_key" ON "IntakeRepresentative"("code" ASC);

-- CreateIndex
CREATE INDEX "IntakeRepresentative_program_idx" ON "IntakeRepresentative"("program" ASC);

-- CreateIndex
CREATE INDEX "IntakeRepresentative_status_idx" ON "IntakeRepresentative"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "IntentWeightProfile_intent_assetCode_systemState_key" ON "IntentWeightProfile"("intent" ASC, "assetCode" ASC, "systemState" ASC);

-- CreateIndex
CREATE INDEX "InterventionDecision_caseId_idx" ON "InterventionDecision"("caseId" ASC);

-- CreateIndex
CREATE INDEX "InvestmentProposal_userId_createdAt_idx" ON "InvestmentProposal"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "LedgerAccount_chainId_tokenType_idx" ON "LedgerAccount"("chainId" ASC, "tokenType" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_chainId_tokenType_type_address_key" ON "LedgerAccount"("chainId" ASC, "tokenType" ASC, "type" ASC, "address" ASC);

-- CreateIndex
CREATE INDEX "LedgerEntry_chainId_accountId_blockNumber_idx" ON "LedgerEntry"("chainId" ASC, "accountId" ASC, "blockNumber" ASC);

-- CreateIndex
CREATE INDEX "LedgerEntry_chainId_tokenType_idx" ON "LedgerEntry"("chainId" ASC, "tokenType" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_chainId_txHash_logIndex_direction_accountId_key" ON "LedgerEntry"("chainId" ASC, "txHash" ASC, "logIndex" ASC, "direction" ASC, "accountId" ASC);

-- CreateIndex
CREATE INDEX "LedgerEntry_chainId_walletEventId_idx" ON "LedgerEntry"("chainId" ASC, "walletEventId" ASC);

-- CreateIndex
CREATE INDEX "idx_ledger_account" ON "LedgerEntry"("accountId" ASC, "tokenType" ASC, "chainId" ASC);

-- CreateIndex
CREATE INDEX "LogoutLog_userId_timestamp_idx" ON "LogoutLog"("userId" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "NFTBadge_userId_mintedAt_idx" ON "NFTBadge"("userId" ASC, "mintedAt" ASC);

-- CreateIndex
CREATE INDEX "NodeSyncStatus_userId_syncedAt_idx" ON "NodeSyncStatus"("userId" ASC, "syncedAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_caseId_idx" ON "Notification"("caseId" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId" ASC);

-- CreateIndex
CREATE INDEX "NotificationReadModel_actorUserId_idx" ON "NotificationReadModel"("actorUserId" ASC);

-- CreateIndex
CREATE INDEX "NotificationReadModel_caseId_idx" ON "NotificationReadModel"("caseId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorAlliance_operatorAId_operatorBId_key" ON "OperatorAlliance"("operatorAId" ASC, "operatorBId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorProfile_operatorId_key" ON "OperatorProfile"("operatorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorTrust_fromOperatorId_toOperatorId_key" ON "OperatorTrust"("fromOperatorId" ASC, "toOperatorId" ASC);

-- CreateIndex
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Opportunity_dossierId_idx" ON "Opportunity"("dossierId" ASC);

-- CreateIndex
CREATE INDEX "Opportunity_source_idx" ON "Opportunity"("source" ASC);

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status" ASC);

-- CreateIndex
CREATE INDEX "OpportunityEvent_actor_idx" ON "OpportunityEvent"("actor" ASC);

-- CreateIndex
CREATE INDEX "OpportunityEvent_createdAt_idx" ON "OpportunityEvent"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "OpportunityEvent_opportunityId_idx" ON "OpportunityEvent"("opportunityId" ASC);

-- CreateIndex
CREATE INDEX "OpportunityEvent_type_idx" ON "OpportunityEvent"("type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug" ASC);

-- CreateIndex
CREATE INDEX "Party_caseId_role_idx" ON "Party"("caseId" ASC, "role" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PinLoginRequest_email_key" ON "PinLoginRequest"("email" ASC);

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "ProjectReview_createdAt_idx" ON "ProjectReview"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ProjectReview_projectId_reviewerId_idx" ON "ProjectReview"("projectId" ASC, "reviewerId" ASC);

-- CreateIndex
CREATE INDEX "QueueHistory_caseId_idx" ON "QueueHistory"("caseId" ASC);

-- CreateIndex
CREATE INDEX "QueueItem_caseId_idx" ON "QueueItem"("caseId" ASC);

-- CreateIndex
CREATE INDEX "QueueItem_status_idx" ON "QueueItem"("status" ASC);

-- CreateIndex
CREATE INDEX "QueueLock_caseId_idx" ON "QueueLock"("caseId" ASC);

-- CreateIndex
CREATE INDEX "ReplayAudit_createdAt_idx" ON "ReplayAudit"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ReplayAudit_decisionId_idx" ON "ReplayAudit"("decisionId" ASC);

-- CreateIndex
CREATE INDEX "ReplayAudit_intentChanged_idx" ON "ReplayAudit"("intentChanged" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_rawToken_key" ON "RevokedToken"("rawToken" ASC);

-- CreateIndex
CREATE INDEX "RiskEvent_eventType_createdAt_idx" ON "RiskEvent"("eventType" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "RiskEvent_userId_createdAt_idx" ON "RiskEvent"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key" ASC);

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId" ASC);

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId" ASC, "permissionId" ASC);

-- CreateIndex
CREATE INDEX "Session_status_expiresAt_idx" ON "Session"("status" ASC, "expiresAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenId_key" ON "Session"("tokenId" ASC);

-- CreateIndex
CREATE INDEX "Session_userId_startedAt_idx" ON "Session"("userId" ASC, "startedAt" ASC);

-- CreateIndex
CREATE INDEX "SessionActionLog_userId_timestamp_idx" ON "SessionActionLog"("userId" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "SessionLog_userId_timestamp_idx" ON "SessionLog"("userId" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "SimProfile_userId_createdAt_idx" ON "SimProfile"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SmartContract_address_key" ON "SmartContract"("address" ASC);

-- CreateIndex
CREATE INDEX "Stake_userId_isActive_idx" ON "Stake"("userId" ASC, "isActive" ASC);

-- CreateIndex
CREATE INDEX "StrategyOutcome_assetCode_idx" ON "StrategyOutcome"("assetCode" ASC);

-- CreateIndex
CREATE INDEX "StrategyOutcome_createdAt_idx" ON "StrategyOutcome"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "StrategyOutcome_intent_scenarioId_idx" ON "StrategyOutcome"("intent" ASC, "scenarioId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Token_symbol_key" ON "Token"("symbol" ASC);

-- CreateIndex
CREATE INDEX "TokenAccessLog_token_accessedAt_idx" ON "TokenAccessLog"("token" ASC, "accessedAt" ASC);

-- CreateIndex
CREATE INDEX "TokenIssuanceRequest_requestedBy_createdAt_idx" ON "TokenIssuanceRequest"("requestedBy" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TokenIssuanceRequest_status_createdAt_idx" ON "TokenIssuanceRequest"("status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Transaction_assetCode_idx" ON "Transaction"("assetCode" ASC);

-- CreateIndex
CREATE INDEX "Transaction_idempotencyKey_idx" ON "Transaction"("idempotencyKey" ASC);

-- CreateIndex
CREATE INDEX "Transaction_tokenId_idx" ON "Transaction"("tokenId" ASC);

-- CreateIndex
CREATE INDEX "Transaction_tokenType_idx" ON "Transaction"("tokenType" ASC);

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Transaction_walletId_createdAt_idx" ON "Transaction"("walletId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionDossier_reference_key" ON "TransactionDossier"("reference" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierBankCoordinate_dossierId_idx" ON "TransactionDossierBankCoordinate"("dossierId" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierBankCoordinate_role_idx" ON "TransactionDossierBankCoordinate"("role" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierBankCoordinate_verificationStatus_idx" ON "TransactionDossierBankCoordinate"("verificationStatus" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierEvent_createdAt_idx" ON "TransactionDossierEvent"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierEvent_dossierId_idx" ON "TransactionDossierEvent"("dossierId" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierEvent_eventType_idx" ON "TransactionDossierEvent"("eventType" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierInstrument_dossierId_idx" ON "TransactionDossierInstrument"("dossierId" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierInstrument_status_idx" ON "TransactionDossierInstrument"("status" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierInstrument_type_idx" ON "TransactionDossierInstrument"("type" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierParty_dossierId_idx" ON "TransactionDossierParty"("dossierId" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierParty_role_idx" ON "TransactionDossierParty"("role" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierReleaseCondition_dossierId_idx" ON "TransactionDossierReleaseCondition"("dossierId" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierReleaseCondition_status_idx" ON "TransactionDossierReleaseCondition"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionDossierTerms_dossierId_key" ON "TransactionDossierTerms"("dossierId" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierTerms_financialInstrumentType_idx" ON "TransactionDossierTerms"("financialInstrumentType" ASC);

-- CreateIndex
CREATE INDEX "TransactionDossierTerms_settlementMethod_idx" ON "TransactionDossierTerms"("settlementMethod" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntake_commodity_idx" ON "TransactionIntake"("commodity" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntake_createdAt_idx" ON "TransactionIntake"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntake_program_idx" ON "TransactionIntake"("program" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntake_promotedAt_idx" ON "TransactionIntake"("promotedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionIntake_promotedOpportunityId_key" ON "TransactionIntake"("promotedOpportunityId" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntake_reference_idx" ON "TransactionIntake"("reference" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionIntake_reference_key" ON "TransactionIntake"("reference" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntake_referralCode_idx" ON "TransactionIntake"("referralCode" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntake_status_idx" ON "TransactionIntake"("status" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntake_submitterEmail_idx" ON "TransactionIntake"("submitterEmail" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntakeEvent_createdAt_idx" ON "TransactionIntakeEvent"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntakeEvent_eventType_idx" ON "TransactionIntakeEvent"("eventType" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntakeEvent_intakeId_idx" ON "TransactionIntakeEvent"("intakeId" ASC);

-- CreateIndex
CREATE INDEX "TransactionIntakeEvent_toStatus_idx" ON "TransactionIntakeEvent"("toStatus" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryAction_idempotencyKey_key" ON "TreasuryAction"("idempotencyKey" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryAlertLog_fingerprint_key" ON "TreasuryAlertLog"("fingerprint" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryApproval_actionId_approverUserId_key" ON "TreasuryApproval"("actionId" ASC, "approverUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryExecutionQueue_treasuryActionId_key" ON "TreasuryExecutionQueue"("treasuryActionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_accessToken_key" ON "User"("accessToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_blockchainWalletId_key" ON "User"("blockchainWalletId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username" ASC);

-- CreateIndex
CREATE INDEX "UserRole_roleId_isActive_idx" ON "UserRole"("roleId" ASC, "isActive" ASC);

-- CreateIndex
CREATE INDEX "UserRole_userId_isActive_idx" ON "UserRole"("userId" ASC, "isActive" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId" ASC, "roleId" ASC);

-- CreateIndex
CREATE INDEX "UserTrustEdge_fromUserId_idx" ON "UserTrustEdge"("fromUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserTrustEdge_fromUserId_toUserId_key" ON "UserTrustEdge"("fromUserId" ASC, "toUserId" ASC);

-- CreateIndex
CREATE INDEX "UserTrustEdge_toUserId_idx" ON "UserTrustEdge"("toUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId" ASC);

-- CreateIndex
CREATE INDEX "axis_journey_subscribers_confirmed_idx" ON "axis_journey_subscribers"("confirmed" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "axis_journey_subscribers_email_key" ON "axis_journey_subscribers"("email" ASC);

-- CreateIndex
CREATE INDEX "axis_journey_subscribers_joinedAt_idx" ON "axis_journey_subscribers"("joinedAt" ASC);

-- CreateIndex
CREATE INDEX "axis_journey_subscribers_origin_idx" ON "axis_journey_subscribers"("origin" ASC);

-- CreateIndex
CREATE INDEX "email_logs_createdAt_type_idx" ON "email_logs"("createdAt" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "email_logs_messageId_idx" ON "email_logs"("messageId" ASC);

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status" ASC);

-- CreateIndex
CREATE INDEX "email_logs_to_idx" ON "email_logs"("to" ASC);

-- CreateIndex
CREATE INDEX "email_logs_type_idx" ON "email_logs"("type" ASC);

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainWallet" ADD CONSTRAINT "BlockchainWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainWallet" ADD CONSTRAINT "BlockchainWallet_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseArtifact" ADD CONSTRAINT "CaseArtifact_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseArtifact" ADD CONSTRAINT "CaseArtifact_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseGate" ADD CONSTRAINT "CaseGate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseParty" ADD CONSTRAINT "CaseParty_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseParty" ADD CONSTRAINT "CaseParty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractInteractionLog" ADD CONSTRAINT "ContractInteractionLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "SmartContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractInteractionLog" ADD CONSTRAINT "ContractInteractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilElder" ADD CONSTRAINT "CouncilElder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalProof" ADD CONSTRAINT "CulturalProof_smartContractId_fkey" FOREIGN KEY ("smartContractId") REFERENCES "SmartContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierApprovalGrant" ADD CONSTRAINT "DossierApprovalGrant_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DossierApprovalRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierApprovalRequirement" ADD CONSTRAINT "DossierApprovalRequirement_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierIssuanceApproval" ADD CONSTRAINT "DossierIssuanceApproval_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Gate" ADD CONSTRAINT "Gate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceProposal" ADD CONSTRAINT "GovernanceProposal_authorElderId_fkey" FOREIGN KEY ("authorElderId") REFERENCES "CouncilElder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceVote" ADD CONSTRAINT "GovernanceVote_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "CouncilElder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceVote" ADD CONSTRAINT "GovernanceVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeFunding" ADD CONSTRAINT "InitiativeFunding_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeFunding" ADD CONSTRAINT "InitiativeFunding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeUpdate" ADD CONSTRAINT "InitiativeUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeUpdate" ADD CONSTRAINT "InitiativeUpdate_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionDecision" ADD CONSTRAINT "InterventionDecision_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentProposal" ADD CONSTRAINT "InvestmentProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoutLog" ADD CONSTRAINT "LogoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTBadge" ADD CONSTRAINT "NFTBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeSyncStatus" ADD CONSTRAINT "NodeSyncStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorProfile" ADD CONSTRAINT "OperatorProfile_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_promotedDossierId_fkey" FOREIGN KEY ("promotedDossierId") REFERENCES "TransactionDossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityEvent" ADD CONSTRAINT "OpportunityEvent_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReview" ADD CONSTRAINT "ProjectReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReview" ADD CONSTRAINT "ProjectReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicVerification" ADD CONSTRAINT "PublicVerification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevokedToken" ADD CONSTRAINT "RevokedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionActionLog" ADD CONSTRAINT "SessionActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionLog" ADD CONSTRAINT "SessionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimProfile" ADD CONSTRAINT "SimProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stake" ADD CONSTRAINT "Stake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "CouncilElder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenIssuanceRequest" ADD CONSTRAINT "TokenIssuanceRequest_approvedTokenId_fkey" FOREIGN KEY ("approvedTokenId") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenIssuanceRequest" ADD CONSTRAINT "TokenIssuanceRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InvestmentProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenIssuanceRequest" ADD CONSTRAINT "TokenIssuanceRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierBankCoordinate" ADD CONSTRAINT "TransactionDossierBankCoordinate_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierEvent" ADD CONSTRAINT "TransactionDossierEvent_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierInstrument" ADD CONSTRAINT "TransactionDossierInstrument_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierParty" ADD CONSTRAINT "TransactionDossierParty_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierReleaseCondition" ADD CONSTRAINT "TransactionDossierReleaseCondition_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDossierTerms" ADD CONSTRAINT "TransactionDossierTerms_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "TransactionDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionIntake" ADD CONSTRAINT "TransactionIntake_promotedOpportunityId_fkey" FOREIGN KEY ("promotedOpportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionIntakeEvent" ADD CONSTRAINT "TransactionIntakeEvent_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "TransactionIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryApproval" ADD CONSTRAINT "TreasuryApproval_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "TreasuryAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationItem" ADD CONSTRAINT "VerificationItem_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
