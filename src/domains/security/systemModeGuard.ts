import { prisma } from '@/infrastructure/db/prisma'
import { WalletError } from '@/engines/wallet/errors'

export async function systemModeGuard() {
  const state = await prisma.systemState.findUnique({
    where: {
      id: 'global',
    },
  })

  // fail-open for now if no state row exists
  if (!state) {
    return {
      mode: 'NORMAL',
    }
  }

  if (state.globalPaused) {
    throw new WalletError(
      'SYSTEM_LOCKDOWN',
      state.reason ||
        'System transfers are temporarily paused.',
      503
    )
  }

  return {
    mode: 'NORMAL',
  }
}