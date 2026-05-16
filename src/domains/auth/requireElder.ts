import { prisma } from '@/infrastructure/db/prisma'

import { requirePrincipal } from './requirePrincipal'
import type { Principal } from './types'

export type ElderPrincipal = {
  principal: Principal
  elder: {
    id: string
    userId: string
  }
}

export async function requireElder(): Promise<ElderPrincipal> {
  const principal = await requirePrincipal()

  const elder = await prisma.councilElder.findUnique({
    where: {
      userId: principal.userId,
    },
  })

  if (!elder || !elder.isActive) {
    throw new Error('Elder authorization required')
  }

  return {
    principal,
    elder: {
      id: elder.id,
      userId: elder.userId,
    },
  }
}