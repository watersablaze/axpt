import { randomInt } from 'node:crypto'

import * as bcrypt from 'bcryptjs'

import { prisma } from '@/infrastructure/db/prisma'
import { sendLoginPin } from './sendLoginPin'
import {
  claimInstitutionalPinChallenge,
} from './claimInstitutionalPinChallenge'
import {
  resolveInstitutionalVisitorSignInWithClient,
} from '@/domains/institutional-access/resolveInstitutionalVisitorSignInWithClient'

import type {
  InstitutionalPinRequestDependencies,
} from './requestInstitutionalLoginPin'

type AuthRoleGrant = {
  role: {
    key: string
    rolePermissions: Array<{
      permission: {
        key: string
      }
    }>
  }
}

function flattenAuthority(
  userRoles: AuthRoleGrant[],
) {
  const roles =
    userRoles.map(
      assignment => assignment.role.key,
    )

  const permissions =
    Array.from(
      new Set(
        userRoles.flatMap(
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

/**
 * Vercel previews must not send institutional PINs.
 * An incomplete Vercel environment identity also fails closed.
 * Production and local rehearsal retain their existing adapters.
 */
function isVercelNonProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === 'preview' ||
    process.env.VERCEL_ENV === 'development' ||
    (
      process.env.VERCEL === '1' &&
      process.env.VERCEL_ENV !== 'production'
    )
  )
}

function isLocalRehearsalDatabase(value: string | undefined): boolean {
  try {
    const url = new URL(value ?? '');
    return (
      (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
      (url.hostname === '127.0.0.1' || url.hostname === 'localhost') &&
      url.port === '5433' &&
      url.pathname === '/axpt_fw_loi_rehearsal' &&
      !url.searchParams.has('host')
    );
  } catch {
    return false;
  }
}

function isRehearsalRecipient(email: string): boolean {
  return (
    email === 'buyer-link-check-01@example.invalid' ||
    email.endsWith('@fw-http-rehearsal.invalid')
  );
}

export function createInstitutionalPinRequestDependencies(
  decisionTime: Date,
): InstitutionalPinRequestDependencies {
  const terminalRequested = process.env.FW_REHEARSAL_PIN_TRANSPORT === 'terminal';
  const terminalEnabled =
    terminalRequested &&
    process.env.NODE_ENV === 'development' &&
    !process.env.VERCEL &&
    !process.env.VERCEL_ENV &&
    isLocalRehearsalDatabase(process.env.DATABASE_URL) &&
    isLocalRehearsalDatabase(process.env.DIRECT_URL);

  return {
    transportReady() {
      if (terminalRequested) return terminalEnabled;

      if (isVercelNonProductionRuntime()) {
        return false
      }

      return Boolean(
        process.env.RESEND_API_KEY?.trim(),
      )
    },

    async findCandidate(email) {
      if (terminalRequested && (!terminalEnabled || !isRehearsalRecipient(email))) {
        return null;
      }

      const user =
        await prisma.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
            email: true,
            userRoles: {
              where: {
                isActive: true,
                revokedAt: null,
              },
              select: {
                role: {
                  select: {
                    key: true,
                    rolePermissions: {
                      select: {
                        permission: {
                          select: {
                            key: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            frenchWardGoverningOfficer: {
              select: {
                status: true,
                endedAt: true,
              },
            },
            frenchWardInstitutionalParticipant: {
              select: {
                status: true,
                endedAt: true,
              },
            },
            representativeProgramParticipants: {
              select: {
                standing: true,
              },
            },
          },
        })

      if (!user) {
        return null
      }

      const {
        roles,
        permissions,
      } = flattenAuthority(
        user.userRoles as AuthRoleGrant[],
      )

      const eligibility =
        await resolveInstitutionalVisitorSignInWithClient({
          client: prisma,
          userId: user.id,
          email: user.email,
          roles,
          permissions,
          frenchWardGoverningStanding:
            user.frenchWardGoverningOfficer,
          frenchWardInstitutionalParticipant:
            user.frenchWardInstitutionalParticipant,
          representativeProgramParticipants:
            user.representativeProgramParticipants,
          now: decisionTime,
        })

      return {
        eligible:
          eligibility.eligible,
      }
    },

    generatePin() {
      return randomInt(
        0,
        1_000_000,
      )
        .toString()
        .padStart(6, '0')
    },

    hashPin(pin) {
      return bcrypt.hash(
        pin,
        12,
      )
    },

    claim(input) {
      return claimInstitutionalPinChallenge(
        prisma,
        input,
      )
    },

    async deliver(input) {
      if (terminalRequested) {
        if (!terminalEnabled || !isRehearsalRecipient(input.email)) {
          throw new Error('INSTITUTIONAL_PIN_REHEARSAL_DELIVERY_DISABLED');
        }

        console.info('[auth/login/request] Rehearsal PIN', input.email, input.pin);
        return;
      }

      if (isVercelNonProductionRuntime()) {
        throw new Error(
          'INSTITUTIONAL_PIN_PREVIEW_DELIVERY_DISABLED',
        )
      }

      await sendLoginPin(input)
    },

    async cleanup({
      email,
      pinHash,
    }) {
      await prisma.pinLoginRequest.deleteMany({
        where: {
          email,
          pinHash,
        },
      })
    },
  }
}
