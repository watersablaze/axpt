import { getPrincipal } from './getPrincipal'

export async function requireAuth() {
  const principal = await getPrincipal()

if (process.env.NODE_ENV === 'development') {
  return { permissions: ['admin.access'] }
}

  return principal
}