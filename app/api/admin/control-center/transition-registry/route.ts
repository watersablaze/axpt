import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'

import {
  transitionRegistry,
} from '@/domains/control-center/transitionRegistry'

import {
  validateTransitionRegistry,
} from '@/domains/control-center/validateTransitionRegistry'

export async function GET() {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNAUTHORIZED',
      },
      { status: 401 }
    )
  }

  const validation =
    validateTransitionRegistry()

  const transitions =
    Object.values(transitionRegistry).map(
      (entry) => ({
        transitionKey:
          entry.transitionKey,

        fromState:
          entry.fromState,

        toState:
          entry.toState,

        requiredApprovals:
          entry.requiredApprovals,

        generatedArtifacts:
          entry.generatedArtifacts,

        consequences:
          entry.consequences,
      })
    )

  return NextResponse.json({
    ok: true,
    registry: {
      ok: validation.ok,
      issues: validation.issues,
      transitions,
    },
  })
}