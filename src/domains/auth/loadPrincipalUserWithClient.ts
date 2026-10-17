import type {
  PrismaClient,
  User,
} from '@prisma/client'

type PrincipalUser = Pick<
  User, 'id' | 'email' | 'displayName' | 'name'
> & {
  userRoles: Array<{
    role: {
      key: string
      rolePermissions: Array<{
        permission: { key: string }
      }>
    }
  }>
  representativeProgramParticipants:
    Array<{
      standing: NonNullable<Awaited<ReturnType<
        PrismaClient['representativeProgramParticipant']['findUnique']
      >>>['standing']
    }>
}

export async function loadPrincipalUserWithClient(
  client: Pick<PrismaClient, '$queryRaw'>,
  userId: string,
): Promise<PrincipalUser | null> {
  const users = await client.$queryRaw<PrincipalUser[]>`
    SELECT u.id, u.email, u."displayName", u.name,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'role', jsonb_build_object(
            'key', r.key,
            'rolePermissions', COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'permission', jsonb_build_object('key', p.key)
              ))
              FROM public."RolePermission" rp
              JOIN public."Permission" p ON p.id = rp."permissionId"
              WHERE rp."roleId" = r.id
            ), '[]'::jsonb)
          )
        ))
        FROM public."UserRole" ur
        JOIN public."Role" r ON r.id = ur."roleId"
        WHERE ur."userId" = u.id
          AND ur."isActive" = true
          AND ur."revokedAt" IS NULL
      ), '[]'::jsonb) AS "userRoles",
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object('standing', participant.standing))
        FROM public."RepresentativeProgramParticipant" participant
        WHERE participant."userId" = u.id
      ), '[]'::jsonb) AS "representativeProgramParticipants"
    FROM public."User" u
    WHERE u.id = ${userId}
  `
  return users[0] ?? null
}
