import { NextResponse } from 'next/server'
import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'
import { prisma } from '@/infrastructure/db/prisma'
import { ASSET_REGISTRY, type AssetCode } from '@/lib/assets/registry'
import { requireSystemHealthy } from '@/domains/system/requireSystemHealthy'

function resolveTargets(
  input: unknown,
  exclude?: string[]
): AssetCode[] | undefined {
  if (input === 'ALL') {
    const all = Object.keys(ASSET_REGISTRY) as AssetCode[]
    return exclude ? all.filter((a) => !exclude.includes(a)) : all
  }

  if (Array.isArray(input)) {
    return input.filter(
      (v): v is AssetCode =>
        typeof v === 'string' && v in ASSET_REGISTRY
    )
  }

  return undefined
}

function arraysEqual(a: unknown, b: unknown) {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
}

function buildMessage(args: {
  globalPaused: boolean
  pausedAssets: string[]
  pausedLayers: string[]
  changed: boolean
}) {
  const { globalPaused, pausedAssets, pausedLayers, changed } = args

  if (!changed) {
    return 'No change — system already in requested state'
  }

  if (globalPaused) return 'System paused'
  if (pausedAssets.length > 0 && pausedLayers.length > 0) {
    return `Restrictions updated — assets: ${pausedAssets.join(', ')} | layers: ${pausedLayers.join(', ')}`
  }
  if (pausedAssets.length > 0) {
    return `Assets restricted: ${pausedAssets.join(', ')}`
  }
  if (pausedLayers.length > 0) {
    return `Layers restricted: ${pausedLayers.join(', ')}`
  }

  return 'System resumed'
}

export async function POST(req: Request) {
  try {
    await requirePermission(PERMISSIONS.TREASURY_PAUSE)

    const health = await requireSystemHealthy()
    if (!health.allowed) {
      return NextResponse.json({ ok: false, error: health.reason }, { status: 503 })
    }

    const body = await req.json()

    const {
      globalPaused,
      pausedAssets,
      pausedLayers,
      targets,
      exclude,
      reason,
    } = body

    const resolvedAssets =
      resolveTargets(targets, exclude) ??
      resolveTargets(pausedAssets) ??
      undefined

    const current = await prisma.systemState.findUnique({
      where: { id: 'global' },
    })

    const nextGlobal =
      typeof globalPaused === 'boolean'
        ? globalPaused
        : current?.globalPaused ?? false

    const nextAssets =
      resolvedAssets ?? (current?.pausedAssets as string[] | null) ?? []

    const nextLayers =
      Array.isArray(pausedLayers)
        ? pausedLayers
        : (current?.pausedLayers as string[] | null) ?? []

    const changed =
      nextGlobal !== (current?.globalPaused ?? false) ||
      !arraysEqual(nextAssets, current?.pausedAssets) ||
      !arraysEqual(nextLayers, current?.pausedLayers) ||
      (reason ?? null) !== (current?.reason ?? null)

    if (!changed) {
      return NextResponse.json({
        ok: true,
        changed: false,
        message: buildMessage({
          globalPaused: nextGlobal,
          pausedAssets: nextAssets,
          pausedLayers: nextLayers,
          changed: false,
        }),
        data: current,
      })
    }

    const updated = await prisma.systemState.upsert({
      where: { id: 'global' },
      update: {
        globalPaused: nextGlobal,
        pausedAssets: nextAssets,
        pausedLayers: nextLayers,
        reason: reason ?? null,
      },
      create: {
        id: 'global',
        globalPaused: nextGlobal,
        pausedAssets: nextAssets,
        pausedLayers: nextLayers,
        reason: reason ?? null,
      },
    })

    return NextResponse.json({
      ok: true,
      changed: true,
      message: buildMessage({
        globalPaused: updated.globalPaused,
        pausedAssets: (updated.pausedAssets as string[] | null) ?? [],
        pausedLayers: (updated.pausedLayers as string[] | null) ?? [],
        changed: true,
      }),
      data: updated,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'pause failed' },
      { status: err.status ?? 500 }
    )
  }
}
