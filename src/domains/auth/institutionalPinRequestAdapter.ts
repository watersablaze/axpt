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

export function createInstitutionalPinRequestDependencies(
  decisionTime: Date,
): InstitutionalPinRequestDependencies {
  return {
    transportReady() {
      return Boolean(
        process.env.RESEND_API_KEY?.trim(),
      )
    },

    async findCandidate(email) {
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
