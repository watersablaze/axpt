-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_REVIEW', 'ACTIVE', 'ESCROW_INITIATED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CaseMode" AS ENUM ('COORDINATION_ONLY', 'FULL_ESCROW');

-- CreateEnum
CREATE TYPE "GateType" AS ENUM ('MANUAL', 'ARTIFACT_REQUIRED', 'SIGNATURE_REQUIRED', 'ESCROW_LOCK', 'ORACLE_CHECK');

-- CreateEnum
CREATE TYPE "GateStatus" AS ENUM ('PENDING', 'ACTIVE', 'VERIFIED', 'REJECTED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CaseWorkflowType" AS ENUM ('COORDINATION', 'ESCROW', 'FUNDING', 'GOVERNANCE', 'ARCHIVE', 'ONBOARDING');

-- CreateEnum
CREATE TYPE "CasePartyRole" AS ENUM ('OWNER', 'PARTICIPANT', 'VERIFIER', 'FUNDER', 'ARBITER', 'COUNCIL');

-- CreateEnum
CREATE TYPE "CaseEventType" AS ENUM ('CASE_CREATED', 'PARTY_ADDED', 'ARTIFACT_UPLOADED', 'GATE_ACTIVATED', 'GATE_PASSED', 'GATE_FAILED', 'CASE_COMPLETED');

-- CreateEnum
CREATE TYPE "ItemAudience" AS ENUM ('ALL', 'SELLER', 'BUYER', 'INTERNAL');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('AXG', 'NMP', 'USD', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'FUNDED');

-- CreateEnum
CREATE TYPE "InitiativeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InitiativeCategory" AS ENUM ('ENERGY', 'FINTECH', 'DATA', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('TREASURY', 'USER', 'EXTERNAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM (type: TRANSACTION_TYPES.DEBIT, type: TRANSACTION_TYPES.CREDIT');

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

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "PinLoginRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PinLoginRequest_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenType" "TokenType",
    "tokenId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,

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

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "NodeSyncStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NodeSyncStatus_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "DbPulseLog" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DbPulseLog_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "CouncilElder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CouncilElder_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "CadaWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CadaWaitlist_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "authorizedSignatory" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hash" TEXT,
    "url" TEXT,
    "uploadedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
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
    "amount" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,

    CONSTRAINT "ChainMirrorEvent_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_accessToken_key" ON "User"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_blockchainWalletId_key" ON "User"("blockchainWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_codeHash_key" ON "AccessCode"("codeHash");

-- CreateIndex
CREATE INDEX "SessionLog_userId_timestamp_idx" ON "SessionLog"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PinLoginRequest_email_key" ON "PinLoginRequest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Balance_walletId_idx" ON "Balance"("walletId");

-- CreateIndex
CREATE INDEX "Balance_userId_idx" ON "Balance"("userId");

-- CreateIndex
CREATE INDEX "Balance_tokenType_idx" ON "Balance"("tokenType");

-- CreateIndex
CREATE INDEX "Balance_tokenId_idx" ON "Balance"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_walletId_tokenType_tokenId_key" ON "Balance"("walletId", "tokenType", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainWallet_walletId_key" ON "BlockchainWallet"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainWallet_userId_key" ON "BlockchainWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainWallet_address_key" ON "BlockchainWallet"("address");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_walletId_createdAt_idx" ON "Transaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_tokenId_idx" ON "Transaction"("tokenId");

-- CreateIndex
CREATE INDEX "Transaction_tokenType_idx" ON "Transaction"("tokenType");

-- CreateIndex
CREATE UNIQUE INDEX "SmartContract_address_key" ON "SmartContract"("address");

-- CreateIndex
CREATE INDEX "ContractInteractionLog_contractId_createdAt_idx" ON "ContractInteractionLog"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractInteractionLog_userId_createdAt_idx" ON "ContractInteractionLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Session_userId_startedAt_idx" ON "Session"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "SessionActionLog_userId_timestamp_idx" ON "SessionActionLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "Stake_userId_isActive_idx" ON "Stake"("userId", "isActive");

-- CreateIndex
CREATE INDEX "InvestmentProposal_userId_createdAt_idx" ON "InvestmentProposal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NFTBadge_userId_mintedAt_idx" ON "NFTBadge"("userId", "mintedAt");

-- CreateIndex
CREATE INDEX "SimProfile_userId_createdAt_idx" ON "SimProfile"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NodeSyncStatus_userId_syncedAt_idx" ON "NodeSyncStatus"("userId", "syncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_rawToken_key" ON "RevokedToken"("rawToken");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE INDEX "TokenAccessLog_token_accessedAt_idx" ON "TokenAccessLog"("token", "accessedAt");

-- CreateIndex
CREATE INDEX "LogoutLog_userId_timestamp_idx" ON "LogoutLog"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Token_symbol_key" ON "Token"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "CouncilElder_userId_key" ON "CouncilElder"("userId");

-- CreateIndex
CREATE INDEX "GovernanceProposal_status_createdAt_idx" ON "GovernanceProposal"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GovernanceProposal_votingEndsAt_idx" ON "GovernanceProposal"("votingEndsAt");

-- CreateIndex
CREATE INDEX "GovernanceVote_proposalId_createdAt_idx" ON "GovernanceVote"("proposalId", "createdAt");

-- CreateIndex
CREATE INDEX "GovernanceVote_elderId_proposalId_idx" ON "GovernanceVote"("elderId", "proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceVote_elderId_proposalId_key" ON "GovernanceVote"("elderId", "proposalId");

-- CreateIndex
CREATE INDEX "TokenIssuanceRequest_requestedBy_createdAt_idx" ON "TokenIssuanceRequest"("requestedBy", "createdAt");

-- CreateIndex
CREATE INDEX "TokenIssuanceRequest_status_createdAt_idx" ON "TokenIssuanceRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId", "status");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectReview_projectId_reviewerId_idx" ON "ProjectReview"("projectId", "reviewerId");

-- CreateIndex
CREATE INDEX "ProjectReview_createdAt_idx" ON "ProjectReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Initiative_slug_key" ON "Initiative"("slug");

-- CreateIndex
CREATE INDEX "Initiative_slug_idx" ON "Initiative"("slug");

-- CreateIndex
CREATE INDEX "Initiative_status_category_idx" ON "Initiative"("status", "category");

-- CreateIndex
CREATE INDEX "InitiativeUpdate_initiativeId_createdAt_idx" ON "InitiativeUpdate"("initiativeId", "createdAt");

-- CreateIndex
CREATE INDEX "InitiativeFunding_initiativeId_createdAt_idx" ON "InitiativeFunding"("initiativeId", "createdAt");

-- CreateIndex
CREATE INDEX "InitiativeFunding_userId_idx" ON "InitiativeFunding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CadaWaitlist_email_key" ON "CadaWaitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "axis_journey_subscribers_email_key" ON "axis_journey_subscribers"("email");

-- CreateIndex
CREATE INDEX "axis_journey_subscribers_confirmed_idx" ON "axis_journey_subscribers"("confirmed");

-- CreateIndex
CREATE INDEX "axis_journey_subscribers_joinedAt_idx" ON "axis_journey_subscribers"("joinedAt");

-- CreateIndex
CREATE INDEX "axis_journey_subscribers_origin_idx" ON "axis_journey_subscribers"("origin");

-- CreateIndex
CREATE INDEX "email_logs_type_idx" ON "email_logs"("type");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_createdAt_type_idx" ON "email_logs"("createdAt", "type");

-- CreateIndex
CREATE INDEX "email_logs_to_idx" ON "email_logs"("to");

-- CreateIndex
CREATE INDEX "email_logs_messageId_idx" ON "email_logs"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Case_referenceCode_key" ON "Case"("referenceCode");

-- CreateIndex
CREATE INDEX "Case_workflowType_idx" ON "Case"("workflowType");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "CaseParty_caseId_idx" ON "CaseParty"("caseId");

-- CreateIndex
CREATE INDEX "CaseGate_caseId_idx" ON "CaseGate"("caseId");

-- CreateIndex
CREATE INDEX "CaseGate_status_idx" ON "CaseGate"("status");

-- CreateIndex
CREATE INDEX "CaseArtifact_caseId_idx" ON "CaseArtifact"("caseId");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_idx" ON "CaseEvent"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Gate_caseId_ord_key" ON "Gate"("caseId", "ord");

-- CreateIndex
CREATE INDEX "ChainMirrorCursor_chainId_idx" ON "ChainMirrorCursor"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorCursor_chainId_contract_key" ON "ChainMirrorCursor"("chainId", "contract");

-- CreateIndex
CREATE INDEX "ChainMirrorEvent_chainId_blockNumber_idx" ON "ChainMirrorEvent"("chainId", "blockNumber");

-- CreateIndex
CREATE INDEX "ChainMirrorEvent_chainId_contract_idx" ON "ChainMirrorEvent"("chainId", "contract");

-- CreateIndex
CREATE UNIQUE INDEX "ChainMirrorEvent_chainId_txHash_logIndex_key" ON "ChainMirrorEvent"("chainId", "txHash", "logIndex");

-- CreateIndex
CREATE INDEX "LedgerAccount_chainId_tokenType_idx" ON "LedgerAccount"("chainId", "tokenType");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_chainId_tokenType_type_address_key" ON "LedgerAccount"("chainId", "tokenType", "type", "address");

-- CreateIndex
CREATE INDEX "LedgerEntry_chainId_walletEventId_idx" ON "LedgerEntry"("chainId", "walletEventId");

-- CreateIndex
CREATE INDEX "LedgerEntry_chainId_accountId_blockNumber_idx" ON "LedgerEntry"("chainId", "accountId", "blockNumber");

-- CreateIndex
CREATE INDEX "LedgerEntry_chainId_tokenType_idx" ON "LedgerEntry"("chainId", "tokenType");

-- CreateIndex
CREATE INDEX "idx_ledger_account" ON "LedgerEntry"("accountId", "tokenType", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_chainId_txHash_logIndex_direction_accountId_key" ON "LedgerEntry"("chainId", "txHash", "logIndex", "direction", "accountId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_caseId_idx" ON "Notification"("caseId");

-- CreateIndex
CREATE INDEX "Escrow_caseId_idx" ON "Escrow"("caseId");

-- AddForeignKey
ALTER TABLE "SessionLog" ADD CONSTRAINT "SessionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalProof" ADD CONSTRAINT "CulturalProof_smartContractId_fkey" FOREIGN KEY ("smartContractId") REFERENCES "SmartContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractInteractionLog" ADD CONSTRAINT "ContractInteractionLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "SmartContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractInteractionLog" ADD CONSTRAINT "ContractInteractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionActionLog" ADD CONSTRAINT "SessionActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stake" ADD CONSTRAINT "Stake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentProposal" ADD CONSTRAINT "InvestmentProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTBadge" ADD CONSTRAINT "NFTBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimProfile" ADD CONSTRAINT "SimProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeSyncStatus" ADD CONSTRAINT "NodeSyncStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevokedToken" ADD CONSTRAINT "RevokedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoutLog" ADD CONSTRAINT "LogoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "CouncilElder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilElder" ADD CONSTRAINT "CouncilElder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceProposal" ADD CONSTRAINT "GovernanceProposal_authorElderId_fkey" FOREIGN KEY ("authorElderId") REFERENCES "CouncilElder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceVote" ADD CONSTRAINT "GovernanceVote_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "CouncilElder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceVote" ADD CONSTRAINT "GovernanceVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenIssuanceRequest" ADD CONSTRAINT "TokenIssuanceRequest_approvedTokenId_fkey" FOREIGN KEY ("approvedTokenId") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenIssuanceRequest" ADD CONSTRAINT "TokenIssuanceRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InvestmentProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenIssuanceRequest" ADD CONSTRAINT "TokenIssuanceRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReview" ADD CONSTRAINT "ProjectReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReview" ADD CONSTRAINT "ProjectReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeUpdate" ADD CONSTRAINT "InitiativeUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeUpdate" ADD CONSTRAINT "InitiativeUpdate_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeFunding" ADD CONSTRAINT "InitiativeFunding_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeFunding" ADD CONSTRAINT "InitiativeFunding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseParty" ADD CONSTRAINT "CaseParty_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseParty" ADD CONSTRAINT "CaseParty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseGate" ADD CONSTRAINT "CaseGate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseArtifact" ADD CONSTRAINT "CaseArtifact_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseArtifact" ADD CONSTRAINT "CaseArtifact_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Gate" ADD CONSTRAINT "Gate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationItem" ADD CONSTRAINT "VerificationItem_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PublicVerification" ADD CONSTRAINT "PublicVerification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
