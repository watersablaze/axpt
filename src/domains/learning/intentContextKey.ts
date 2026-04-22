export function buildIntentContextKey(args: {
  intent: string
  assetCode?: string
  systemState?: string
}) {
  return {
    intent: args.intent,
    assetCode: args.assetCode ?? 'GLOBAL',
    systemState: args.systemState ?? null,
  }
}
