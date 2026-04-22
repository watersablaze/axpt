import { notFound } from 'next/navigation'
import PrincipalSwitchboard from '@/components/admin/dev/PrincipalSwitchboard'

export default function DevPrincipalsPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return (
    <main className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Dev Principal Switchboard</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Bootstrap isolated dev principals for local multi-actor testing.
        </p>
      </div>

      <PrincipalSwitchboard />
    </main>
  )
}