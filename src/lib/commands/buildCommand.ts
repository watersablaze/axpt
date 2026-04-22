export function buildCommand({
  type,
  entity,
  exclude,
}: {
  type: 'PAUSE_ASSETS' | 'RESUME_ASSETS'
  entity: {
    assets: string[]
    wallets: string[]
  }
  exclude?: string[]
}) {
  return {
    type,
    scope: 'ASSET' as const,
    targets: entity.assets.length ? entity.assets : ('ALL' as const),
    exclude,
    requiresSelection: true,
  }
}
