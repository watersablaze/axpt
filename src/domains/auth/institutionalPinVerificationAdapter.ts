import { randomUUID } from 'node:crypto'

import * as bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

import { prisma } from '@/infrastructure/db/prisma'
import { loadPrincipalUserWithClient } from './loadPrincipalUserWithClient'
import { resolveInstitutionalVisitorSignInWithClient } from '@/domains/institutional-access/resolveInstitutionalVisitorSignInWithClient'

import type {
  EstablishedInstitutionalSession,
  InstitutionalPinVerificationDependencies,
  InstitutionalSessionTier,
} from './verifyInstitutionalLoginPin'

const MAX_ATTEMPTS = 5
const SESSION_LIFETIME_MS =
  7 * 24 * 60 * 60 * 1000

type TransactionClient = Pick<
  typeof prisma,
  | '$queryRaw'
  | 'user'
  | 'pinLoginRequest'
  | 'session'
  | 'institutionalAccessGrant'
  | 'frenchWardGoverningOfficer'
>

function flattenAuthority(input: {
  userRoles: Array<{
    role: {
      key: string
      rolePermissions: Array<{
        permission: {
          key: string
        }
      }>
    }
  }>
}) {
  const roles =
    input.userRoles.map(
      assignment => assignment.role.key,
    )

  const permissions =
    Array.from(
      new Set(
        input.userRoles.flatMap(
          assignment =>
            assignment.role.rolePermissions.map(
              grant => grant.permission.key,
            ),
        ),
      ),
    )

  return {
    roles,
    permissions,
  }
}

function tierForAudience(
  audience:
    EstablishedInstitutionalSession['audience'],
): InstitutionalSessionTier {
  if (audience === 'FRENCH_WARD_GOVERNING') {
    return 'french-ward-governance'
  }

  if (audience === 'REPRESENTATIVE') {
    return 'representative'
  }

  if (audience === 'INSTITUTIONAL_VISITOR') {
    return 'institutional-visitor'
  }

  return 'operations'
}

function fallbackDisplayName(
  audience:
    EstablishedInstitutionalSession['audience'],
) {
  if (audience === 'FRENCH_WARD_GOVERNING') {
    return 'French-Ward Officer'
  }

  if (audience === 'REPRESENTATIVE') {
    return 'Representative'
  }

  if (audience === 'INSTITUTIONAL_VISITOR') {
    return 'Institutional Visitor'
  }

  return 'Operator'
}

export function createInstitutionalPinVerificationDependencies(
  metadata: {
    ip?: string | null
    userAgent?: string | null
  } = {},
): InstitutionalPinVerificationDependencies {
  return {
    findChallenge: email =>
      prisma.pinLoginRequest.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          pinHash: true,
          attemptCount: true,
          expiresAt: true,
          consumedAt: true,
        },
      }),

    comparePin: (pin, hash) =>
      bcrypt.compare(pin, hash),

    async recordInvalidAttempt({
      challengeId,
      challengePinHash,
      now,
    }) {
      await prisma.pinLoginRequest.updateMany({
        where: {
          id: challengeId,
          pinHash: challengePinHash,
          consumedAt: null,
          expiresAt: {
            gt: now,
          },
          attemptCount: {
            lt: MAX_ATTEMPTS,
          },
        },
        data: {
          attemptCount: {
            increment: 1,
          },
        },
      })
    },

    async establishSession({
      challengeId,
      challengePinHash,
      email,
      now,
    }): Promise<EstablishedInstitutionalSession | null> {
      const tokenId = randomUUID()

      const expiresAt =
        new Date(
          now.getTime() +
            SESSION_LIFETIME_MS,
        )

      return prisma.$transaction(
        async (tx: TransactionClient) => {
          const lockedUsers =
            await tx.$queryRaw<
              Array<{ id: string }>
            >`
              SELECT id
              FROM "User"
              WHERE email = ${email}
              FOR UPDATE
            `

          if (lockedUsers.length !== 1) {
            return null
          }

          const lockedUserId =
            lockedUsers[0]?.id

          if (!lockedUserId) {
            return null
          }

          const user =
            await loadPrincipalUserWithClient(
              tx,
              lockedUserId,
            )

          if (
            !user ||
            user.email.trim().toLowerCase() !==
              email
          ) {
            return null
          }

          const {
            roles,
            permissions,
          } = flattenAuthority(user)

          const governingStanding =
            await tx.frenchWardGoverningOfficer.findUnique({
              where: {
                userId: user.id,
              },
              select: {
                status: true,
                endedAt: true,
              },
            })

          const eligibility =
            await resolveInstitutionalVisitorSignInWithClient({
              client: tx,
              userId: user.id,
              email,
              roles,
              permissions,
              frenchWardGoverningStanding:
                governingStanding,
              representativeProgramParticipants:
                user.representativeProgramParticipants,
              now,
            })

          if (!eligibility.eligible) {
            return null
          }

          const consumed =
            await tx.pinLoginRequest.updateMany({
              where: {
                id: challengeId,
                email,
                pinHash: challengePinHash,
                consumedAt: null,
                expiresAt: {
                  gt: now,
                },
                attemptCount: {
                  lt: MAX_ATTEMPTS,
                },
              },
              data: {
                consumedAt: now,
              },
            })

          if (consumed.count !== 1) {
            return null
          }

          await tx.session.create({
            data: {
              userId: user.id,
              tokenId,
              status: 'active',
              startedAt: now,
              expiresAt,
              ip:
                metadata.ip ?? null,
              userAgent:
                metadata.userAgent ?? null,
              deviceInfo:
                metadata.userAgent ?? null,
            },
          })

          await tx.user.update({
            where: {
              id: user.id,
            },
            data: {
              lastLogin: now,
              loginCount: {
                increment: 1,
              },
            },
          })

          return {
            userId: user.id,
            email: user.email,
            tokenId,
            audience:
              eligibility.audience,
            tier:
              tierForAudience(
                eligibility.audience,
              ),
            roles,
            displayName:
              user.displayName ??
              user.name ??
              fallbackDisplayName(
                eligibility.audience,
              ),
          }
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
          maxWait: 10000,
          timeout: 30000,
        },
      )
    },
  }
}
