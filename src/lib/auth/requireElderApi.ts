import { requireElder } from '@/domains/auth/requireElder'

export async function requireElderApi() {
  try {
    const auth = await requireElder()

    return {
      elder: auth.elder,
      user: {
        id: auth.principal.userId,
        email: auth.principal.email,
      },
      principal: auth.principal,
    }
  } catch {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
}