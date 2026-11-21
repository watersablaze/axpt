-- Establish the AXPT institutional operator on protected Production.
-- Preserves the canonical actor ID; copies no development credential.
-- Does not create a PIN, session, DSI, grant, or settlement event.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
BEGIN
  IF (SELECT count(*) FROM "_prisma_migrations"
      WHERE migration_name IN (
        '20260926035000_reconcile_production_dsi_runtime',
        '20260926043000_reconcile_production_auth_kernel',
        '20260926050000_add_domain_event_occurred_at_index'
      ) AND finished_at IS NOT NULL) <> 3
  THEN RAISE EXCEPTION 'Schema reconciliations incomplete'; END IF;

  IF EXISTS (SELECT 1 FROM "User"
             WHERE id = 'cmnvt0mri0000w02q1lbj123g'
                OR username = 'admin'
                OR email = 'connect@axpt.io')
     OR EXISTS (SELECT 1 FROM "Role")
     OR EXISTS (SELECT 1 FROM "Permission")
     OR EXISTS (SELECT 1 FROM "UserRole")
     OR EXISTS (SELECT 1 FROM "RolePermission")
  THEN RAISE EXCEPTION 'Operator or RBAC precondition changed'; END IF;

  IF EXISTS (SELECT 1 FROM "InstitutionalInstrument"
             WHERE reference = 'FW-DSI-2026-001')
     OR EXISTS (SELECT 1 FROM "DomainEvent")
  THEN RAISE EXCEPTION 'IGR history already present'; END IF;
END $$;

INSERT INTO "Role"
  (id, key, label, "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'ADMIN_PLATFORM',
   'Platform Administrator', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'TREASURY_APPROVER',
   'Treasury Approver', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CONTRACT_OPERATOR',
   'Contract Operator', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Permission"
  (id, key, label, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, key, key, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM unnest(ARRAY[
  'admin.access',
  'ADMIN_SURFACE_ACCESS',
  'COMMUNICATIONS_ACCESS',
  'COMMUNICATIONS_DIRECT_CREATE',
  'COMMUNICATIONS_GROUP_CREATE',
  'COMMUNICATIONS_MESSAGE_SEND',
  'COMMUNICATIONS_CONVERSATION_MANAGE',
  'SYSTEM_MANAGE_AUTH',
  'SYSTEM_READ_AUDIT',
  'SYSTEM_VIEW_REPLAY',
  'SYSTEM_VIEW_DRIFT',
  'TREASURY_READ',
  'TREASURY_SYNC',
  'TREASURY_EXECUTE_INTENT',
  'TREASURY_PAUSE',
  'TREASURY_RUN_AUTONOMOUS_LOOP',
  'CONTRACT_READ',
  'CONTRACT_SYNC',
  'CONTRACT_MINT',
  'CONTRACT_PAUSE'
]::text[]) AS key;

WITH authority(role_key, permission_key) AS (
  SELECT 'ADMIN_PLATFORM', unnest(ARRAY[
    'admin.access', 'ADMIN_SURFACE_ACCESS',
    'COMMUNICATIONS_ACCESS', 'COMMUNICATIONS_DIRECT_CREATE',
    'COMMUNICATIONS_GROUP_CREATE', 'COMMUNICATIONS_MESSAGE_SEND',
    'COMMUNICATIONS_CONVERSATION_MANAGE', 'SYSTEM_MANAGE_AUTH',
    'SYSTEM_READ_AUDIT', 'SYSTEM_VIEW_REPLAY', 'SYSTEM_VIEW_DRIFT'
  ]::text[])
  UNION ALL
  SELECT 'TREASURY_APPROVER', unnest(ARRAY[
    'TREASURY_READ', 'TREASURY_SYNC', 'TREASURY_EXECUTE_INTENT',
    'TREASURY_PAUSE', 'TREASURY_RUN_AUTONOMOUS_LOOP'
  ]::text[])
  UNION ALL
  SELECT 'CONTRACT_OPERATOR', unnest(ARRAY[
    'CONTRACT_READ', 'CONTRACT_SYNC', 'CONTRACT_MINT', 'CONTRACT_PAUSE'
  ]::text[])
)
INSERT INTO "RolePermission"
  (id, "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r.id, p.id, CURRENT_TIMESTAMP
FROM authority a
JOIN "Role" r ON r.key = a.role_key
JOIN "Permission" p ON p.key = a.permission_key;

INSERT INTO "User"
  (id, username, email, "passwordHash", "isAdmin",
   "displayName", name, "viewedDocs", metadata, "createdAt", "updatedAt")
VALUES
  ('cmnvt0mri0000w02q1lbj123g',
   'admin',
   'connect@axpt.io',
   'PIN_ONLY_DISABLED_' || replace(gen_random_uuid()::text, '-', ''),
   true,
   'AXPT Operator',
   'AXPT Operator',
   ARRAY[]::text[],
   '{"authorityOrigin":"protected-production-reconciliation",
     "authentication":"email-pin",
     "developmentCredentialsCopied":false}'::jsonb,
   CURRENT_TIMESTAMP,
   CURRENT_TIMESTAMP);

INSERT INTO "UserRole"
  (id, "userId", "roleId", "grantedAt", "isActive")
SELECT gen_random_uuid()::text,
       'cmnvt0mri0000w02q1lbj123g',
       id,
       CURRENT_TIMESTAMP,
       true
FROM "Role";

DO $$
BEGIN
  IF (SELECT count(*) FROM "Role") <> 3
     OR (SELECT count(*) FROM "Permission") <> 20
     OR (SELECT count(*) FROM "RolePermission") <> 20
     OR (SELECT count(*) FROM "UserRole") <> 3
     OR (SELECT count(*) FROM "User"
         WHERE id = 'cmnvt0mri0000w02q1lbj123g'
           AND email = 'connect@axpt.io'
           AND username = 'admin'
           AND "isAdmin" = true) <> 1
  THEN RAISE EXCEPTION 'Operator authority postcondition failed'; END IF;

  IF EXISTS (SELECT 1 FROM "InstitutionalInstrument"
             WHERE reference = 'FW-DSI-2026-001')
     OR EXISTS (SELECT 1 FROM "DomainEvent")
  THEN RAISE EXCEPTION 'IGR history changed'; END IF;
END $$;

COMMIT;
