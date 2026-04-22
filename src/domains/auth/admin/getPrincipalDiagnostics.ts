import { getPrincipal } from '@/domains/auth/getPrincipal'

export async function getPrincipalDiagnostics() {
  const principal = await getPrincipal()

  return {
    principalId: principal?.userId ?? null,
    email: principal?.email ?? null,
    authSource: principal ? 'session' : 'unknown',
    sessionCookiePresent: Boolean(principal),
    expiresAt: null,
    decodedClaims: principal ?? {},
  }
}
