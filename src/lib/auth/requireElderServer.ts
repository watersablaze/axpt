import { redirect } from 'next/navigation'

import { requireElder } from '@/domains/auth/requireElder'

export async function requireElderServer() {
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
    redirect('/landing')
  }
}