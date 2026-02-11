import { validateChainMirrorEnv } from '@/lib/env/validateChainMirrorEnv'
import { startReadOnlyChainMirror } from './roWorker'

export async function bootstrapChainMirrorRO() {
  console.log('[ChainMirror] bootstrap starting…')
  validateChainMirrorEnv()
  console.log('[ChainMirror] environment locked')
  console.log('[ChainMirror] read-only worker online')
  await startReadOnlyChainMirror()
}

if (require.main === module) {
  bootstrapChainMirrorRO().catch((err) => {
    console.error('[ChainMirror] fatal', err)
    process.exit(1)
  })
}