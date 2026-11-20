-- AXPT Production Auth Kernel Reconciliation
--
-- Purpose:
--   Reconcile the structural authentication / authorization authority
--   required by the canonical AXPT operator session flow without
--   replaying historical migrations against the baselined Production
--   database.
--
-- This migration is structural only.
--
-- It does NOT:
--   - create connect@axpt.io
--   - create or assign roles
--   - seed permissions
--   - create sessions
--   - modify PIN challenges
--   - promote the DSI
--   - rotate access credentials
--   - send email

BEGIN;

-- ============================================================
-- USER SCHEMA PARITY
-- ============================================================

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS
"metadata" JSONB;

-- ============================================================
-- GOVERNED SESSION AUTHORITY
-- ============================================================

ALTER TABLE "Session"
ADD COLUMN IF NOT EXISTS
"expiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS
"invalidatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS
"lastSeenAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS
"tokenId" TEXT;

-- Current PIN flow authority.
-- Production already records the later PIN migration, but these
-- guards make the reconciliation structurally complete.

ALTER TABLE "PinLoginRequest"
ADD COLUMN IF NOT EXISTS
"attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS
"consumedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS
"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- ROLE AUTHORITY
-- ============================================================

CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey"
      PRIMARY KEY ("id")
);

-- ============================================================
-- PERMISSION AUTHORITY
-- ============================================================

CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey"
      PRIMARY KEY ("id")
);

-- ============================================================
-- USER ↔ ROLE AUTHORITY
-- ============================================================

CREATE TABLE IF NOT EXISTS "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserRole_pkey"
      PRIMARY KEY ("id")
);

-- ============================================================
-- ROLE ↔ PERMISSION AUTHORITY
-- ============================================================

CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey"
      PRIMARY KEY ("id")
);

-- ============================================================
-- CANONICAL INDEX AUTHORITY
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
"Session_tokenId_key"
ON "Session"("tokenId");

CREATE INDEX IF NOT EXISTS
"Session_status_expiresAt_idx"
ON "Session"("status", "expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS
"Role_key_key"
ON "Role"("key");

CREATE UNIQUE INDEX IF NOT EXISTS
"Permission_key_key"
ON "Permission"("key");

CREATE INDEX IF NOT EXISTS
"UserRole_userId_isActive_idx"
ON "UserRole"("userId", "isActive");

CREATE INDEX IF NOT EXISTS
"UserRole_roleId_isActive_idx"
ON "UserRole"("roleId", "isActive");

CREATE UNIQUE INDEX IF NOT EXISTS
"UserRole_userId_roleId_key"
ON "UserRole"("userId", "roleId");

CREATE INDEX IF NOT EXISTS
"RolePermission_roleId_idx"
ON "RolePermission"("roleId");

CREATE INDEX IF NOT EXISTS
"RolePermission_permissionId_idx"
ON "RolePermission"("permissionId");

CREATE UNIQUE INDEX IF NOT EXISTS
"RolePermission_roleId_permissionId_key"
ON "RolePermission"("roleId", "permissionId");

-- ============================================================
-- FOREIGN KEY AUTHORITY
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = '"UserRole"'::regclass
      AND conname = 'UserRole_userId_fkey'
  ) THEN
    ALTER TABLE "UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = '"UserRole"'::regclass
      AND conname = 'UserRole_roleId_fkey'
  ) THEN
    ALTER TABLE "UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey"
    FOREIGN KEY ("roleId")
    REFERENCES "Role"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = '"RolePermission"'::regclass
      AND conname = 'RolePermission_roleId_fkey'
  ) THEN
    ALTER TABLE "RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey"
    FOREIGN KEY ("roleId")
    REFERENCES "Role"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = '"RolePermission"'::regclass
      AND conname = 'RolePermission_permissionId_fkey'
  ) THEN
    ALTER TABLE "RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey"
    FOREIGN KEY ("permissionId")
    REFERENCES "Permission"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END
$$;

COMMIT;
