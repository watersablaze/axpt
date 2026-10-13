BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM "Role"
    WHERE key = 'ADMIN_PLATFORM'
  ) <> 1
  THEN
    RAISE EXCEPTION
      'ADMIN_PLATFORM role prerequisite not satisfied';
  END IF;
END $$;

INSERT INTO "Permission" (
  id,
  key,
  label,
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'INSTITUTIONAL_ACCESS_MANAGE',
  'Manage Institutional Access',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key)
DO UPDATE SET
  label = EXCLUDED.label,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" (
  id,
  "roleId",
  "permissionId",
  "createdAt"
)
SELECT
  gen_random_uuid()::text,
  r.id,
  p.id,
  CURRENT_TIMESTAMP
FROM "Role" r
JOIN "Permission" p
  ON p.key = 'INSTITUTIONAL_ACCESS_MANAGE'
WHERE r.key = 'ADMIN_PLATFORM'
ON CONFLICT ("roleId", "permissionId")
DO NOTHING;

DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM "Permission"
    WHERE key = 'INSTITUTIONAL_ACCESS_MANAGE'
  ) <> 1
  THEN
    RAISE EXCEPTION
      'INSTITUTIONAL_ACCESS_MANAGE permission invariant failed';
  END IF;

  IF (
    SELECT count(*)
    FROM "RolePermission" rp
    JOIN "Role" r
      ON r.id = rp."roleId"
    JOIN "Permission" p
      ON p.id = rp."permissionId"
    WHERE
      r.key = 'ADMIN_PLATFORM'
      AND p.key = 'INSTITUTIONAL_ACCESS_MANAGE'
  ) <> 1
  THEN
    RAISE EXCEPTION
      'ADMIN_PLATFORM institutional-access authority binding failed';
  END IF;
END $$;

COMMIT;
