-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('AXG', 'NMP', 'USD', 'OTHER');

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
    "address" TEXT NOT NULL,

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

    CONSTRAINT "SmartContract_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_accessToken_key" ON "User"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_blockchainWalletId_key" ON "User"("blockchainWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "PinLoginRequest_email_key" ON "PinLoginRequest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainWallet_walletId_key" ON "BlockchainWallet"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainWallet_userId_key" ON "BlockchainWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartContract_address_key" ON "SmartContract"("address");

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_rawToken_key" ON "RevokedToken"("rawToken");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

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
ALTER TABLE "ContractInteractionLog" ADD CONSTRAINT "ContractInteractionLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "SmartContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractInteractionLog" ADD CONSTRAINT "ContractInteractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Token" ADD CONSTRAINT "Token_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "CouncilElder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "TokenIssuanceRequest" ADD CONSTRAINT "TokenIssuanceRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenIssuanceRequest" ADD CONSTRAINT "TokenIssuanceRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InvestmentProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

