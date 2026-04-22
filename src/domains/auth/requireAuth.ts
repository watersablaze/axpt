import { getPrincipal } from './getPrincipal'

export async function requireAuth() {
  const principal = await getPrincipal()

  if (!principal) {
    const error = new Error('Unauthorized')
    ;(error as any).status = 401
    throw error
  }

  return principal
}