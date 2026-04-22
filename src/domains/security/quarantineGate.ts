import { WalletError } from '@/engines/wallet/errors'
import { getUserMetadata } from './mergeUserMetadata'

export async function quarantineGate(userId: string) {
  const metadata = await getUserMetadata(userId)

  if (metadata.quarantine === true) {
    throw new WalletError(
      'USER_QUARANTINED',
      'User is quarantined due to suspicious activity.',
      403
    )
  }
}