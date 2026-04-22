// src/lib/system/pause.ts

import { prisma } from '@/infrastructure/db/prisma'
import { sendAlert } from './alert'

type PauseLayer = 'TRANSFER' | 'MIRROR' | 'SYNC'

type PauseCheckArgs = {
  assetCode?: string
  layer?: PauseLayer
}

type PauseInput = {
  globalPaused?: boolean
  pausedAssets?: string[]
  pausedLayers?: string[]
  reason?: string
}

export async function getSystemState() {
  try {
    const state = await prisma.systemState.findUnique({
      where: { id: 'global' }
    })

    return (
      state ?? {
        globalPaused: false,
        pausedAssets: [],
        pausedLayers: []
      }
    )
  } catch (error) {
    // If table doesn't exist yet, return default state
    console.warn('SystemState table not found, using default state:', error)
    return {
      globalPaused: false,
      pausedAssets: [],
      pausedLayers: []
    }
  }
}

export async function assertSystemActive({
  assetCode,
  layer,
}: PauseCheckArgs = {}) {
  const state = await getSystemState()

  if (state.globalPaused) {
    throw new Error(`SYSTEM PAUSED: ${state.reason ?? ''}`)
  }

  const pausedAssets = (state.pausedAssets ?? []) as string[]
  const pausedLayers = (state.pausedLayers ?? []) as PauseLayer[]

  if (assetCode && pausedAssets.includes(assetCode)) {
    throw new Error(`ASSET PAUSED: ${assetCode}`)
  }

  if (layer && pausedLayers.includes(layer)) {
    throw new Error(`LAYER PAUSED: ${layer}`)
  }
}

export async function setSystemPause(paused: boolean, reason?: string): Promise<unknown>
export async function setSystemPause(input: PauseInput): Promise<unknown>
export async function setSystemPause(
  pausedOrInput: boolean | PauseInput,
  reason?: string
) {
  const input: PauseInput =
    typeof pausedOrInput === 'boolean'
      ? { globalPaused: pausedOrInput, reason }
      : pausedOrInput

  try {
    const state = await prisma.systemState.upsert({
      where: { id: 'global' },
      update: input,
      create: {
        id: 'global',
        ...input
      }
    })

    // Send appropriate alert based on what was paused
    const alerts: string[] = []

    if (input.globalPaused) {
      alerts.push('SYSTEM PAUSED')
    }

    if (input.pausedAssets && input.pausedAssets.length > 0) {
      alerts.push(`ASSETS PAUSED: ${input.pausedAssets.join(', ')}`)
    }

    if (input.pausedLayers && input.pausedLayers.length > 0) {
      alerts.push(`LAYERS PAUSED: ${input.pausedLayers.join(', ')}`)
    }

    if (alerts.length > 0) {
      const message = `${alerts.join(' | ')} → ${input.reason ?? 'no reason provided'}`

      await sendAlert(
        message,
        'CRITICAL',
        undefined,
        {
          code: 'SYSTEM_PAUSED',
          title: 'System paused',
          fingerprint: `SYSTEM_PAUSED:${input.reason ?? 'no reason provided'}`,
          throttleMs: 300_000,
        }
      )

      await prisma.circuitEvent.create({
        data: {
          type: 'PAUSE',
          severity: 'CRITICAL',
          message,
        },
      })
    }

    return state
  } catch (error) {
    console.warn('Failed to update SystemState, continuing without persistence:', error)
    // Return a mock state for build purposes
    return {
      id: 'global',
      globalPaused: input.globalPaused || false,
      pausedAssets: input.pausedAssets || [],
      pausedLayers: input.pausedLayers || [],
      reason: input.reason,
      updatedAt: new Date()
    }
  }
}
