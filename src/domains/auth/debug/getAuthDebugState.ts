import { cookies } from 'next/headers'
import { prisma } from '@/infrastructure/db/prisma'
import { decodeSessionToken } from '@/lib/auth/session'
import { getPrincipal } from '@/domains/auth/getPrincipal'

export type AuthDebugState = {
  cookiePresent: boolean
  cookieName: string
  sessionValid: boolean
  sessionPayload: Record<string, unknown> | null
  principal: {
    userId: string
    email: string
    displayName: string | null
    roles: string[]
    permissions: string[]
    sessionId?: string | null
  } | null
  legacySignals: {
    devImpersonateCookiePresent: boolean
    treasuryActorCookiePresent: boolean
    councilCookiePresent: boolean
    sessionFallbackQueryEnabled: boolean
  }
  dbUser: {
    id: string
    email: string
    isAdmin: boolean
    tier: string | null
    hasCouncilElder: boolean
    activeUserRoles: string[]
  } | null
}

export async function getAuthDebugState(): Promise<AuthDebugState> {
  const cookieStore = await cookies()

  const axptCookieName = 'axpt_session'
  const rawSession = cookieStore.get(axptCookieName)?.value ?? null
  const devImpersonate = cookieStore.get('dev_impersonate_email')?.value ?? null
  const treasuryActor = cookieStore.get('dev_actor_email')?.value ?? null
  const councilCookie =
    cookieStore.get('axpt_council')?.value ??
    cookieStore.get('council_session')?.value ??
    null

  let sessionPayload: Record<string, unknown> | null = null
  let sessionValid = false

  if (rawSession) {
    try {
      const decoded = await decodeSessionToken(rawSession)
      if (decoded) {
        sessionPayload = decoded as Record<string, unknown>
        sessionValid = true
      }
    } catch {
      sessionPayload = null
      sessionValid = false
    }
  }

  const principal = await getPrincipal()

  let dbUser: AuthDebugState['dbUser'] = null

  if (principal?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: principal.userId },
      include: {
        councilElder: true,
        userRoles: {
          where: {
            isActive: true,
            revokedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    })

    if (user) {
      dbUser = {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        tier: user.tier ?? null,
        hasCouncilElder: Boolean(user.councilElder?.isActive),
        activeUserRoles: user.userRoles.map(
          (userRole: { role: { key: string } }) => userRole.role.key
        ),
      }
    }
  }

  return {
    cookiePresent: Boolean(rawSession),
    cookieName: axptCookieName,
    sessionValid,
    sessionPayload,
    principal: principal
      ? {
          userId: principal.userId,
          email: principal.email,
          displayName: principal.displayName ?? null,
          roles: principal.roles,
          permissions: principal.permissions,
          sessionId: principal.sessionId ?? null,
        }
      : null,
    legacySignals: {
      devImpersonateCookiePresent: Boolean(devImpersonate),
      treasuryActorCookiePresent: Boolean(treasuryActor),
      councilCookiePresent: Boolean(councilCookie),
      sessionFallbackQueryEnabled: false, // This was a legacy mechanism and is now always false
    },
    dbUser,
  }
}
