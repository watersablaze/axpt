import { prisma } from '@/infrastructure/db/prisma'
import { WalletError } from '@/engines/wallet/errors'

type SystemMode = 'NORMAL' | 'ELEVATED' | 'DEFENSIVE' | 'LOCKDOWN'

export async function systemModeGuard() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'SYSTEM_MODE' },
    select: { value: true },
  })

  if (!setting?.value) {
    return { mode: 'NORMAL' as SystemMode }
  }

  let parsed: { mode?: SystemMode } | null = null

  try {
    parsed = JSON.parse(setting.value)
  } catch {
    return { mode: 'NORMAL' as SystemMode }
  }

  const mode = parsed?.mode ?? 'NORMAL'

  if (mode === 'LOCKDOWN') {
    throw new WalletError(
      'SYSTEM_LOCKDOWN',
      'System is in lockdown mode. Transfers are temporarily disabled.',
      503
    )
  }

  return { mode }
}