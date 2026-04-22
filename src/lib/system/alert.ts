import { createHash } from 'node:crypto'
import { prisma } from '@/infrastructure/db/prisma'

type AlertLevel = 'INFO' | 'WARN' | 'CRITICAL'

type SendAlertOptions = {
  code?: string
  title?: string
  fingerprint?: string
  throttleMs?: number
  walletId?: string
  txHash?: string
}

const DEFAULT_THROTTLE_MS = 60_000

function buildFingerprint(level: AlertLevel, message: string, fingerprint?: string) {
  const source = fingerprint ?? `${level}:${message}`
  return createHash('sha256').update(source).digest('hex')
}

export async function sendAlert(
  message: string,
  level: 'INFO' | 'WARN' | 'CRITICAL' = 'INFO',
  metadata?: Record<string, any>,
  options: SendAlertOptions = {}
) {
  console.log(`[ALERT][${level}] ${message}`)

  const now = new Date()
  const throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS
  const fingerprint = buildFingerprint(level, message, options.fingerprint)
  const existing = await prisma.treasuryAlertLog.findUnique({
    where: { fingerprint },
  })

  if (existing && now.getTime() - existing.createdAt.getTime() < throttleMs) {
    return { sent: false, throttled: true, alertId: existing.id }
  }

  await prisma.circuitEvent.create({
    data: {
      type: 'ALERT',
      severity: level,
      message,
      metadata: {
        ...metadata,
        code: options.code,
        title: options.title,
        walletId: options.walletId,
        txHash: options.txHash,
        fingerprint,
      },
    },
  })

  const payload = {
    code: options.code ?? 'SYSTEM_ALERT',
    level,
    title: options.title ?? message,
    message,
    walletId: options.walletId ?? null,
    txHash: options.txHash ?? null,
    fingerprint,
    createdAt: now,
  }

  if (existing) {
    await prisma.treasuryAlertLog.update({
      where: { fingerprint },
      data: payload,
    })
  } else {
    await prisma.treasuryAlertLog.create({
      data: payload,
    })
  }

  console.log(`[ALERT][${level}] ${now.toISOString()} -> ${message}`)

  // future:
  // await sendTelegram(message)
  // await sendEmail(message)

  return {
    sent: true,
    throttled: false,
    alertId: existing?.id ?? null,
  }
}
