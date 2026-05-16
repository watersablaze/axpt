import { getPrincipal } from './getPrincipal'
import type { Principal } from './types'

export async function requirePrincipal(): Promise<Principal> {
  const principal = await getPrincipal()

  if (!principal) {
    throw new Error('Authentication required')
  }

  return principal
}