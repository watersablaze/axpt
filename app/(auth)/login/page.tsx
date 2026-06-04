'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('connect@axpt.io')
  const [error, setError] = useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')

    const res = await fetch('/api/dev/auth/bootstrap-user', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Login failed')
      return
    }

    router.push('/admin/control-center')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-gray-900 p-8 shadow-md"
      >
        <h1 className="text-xl font-bold">
          AXPT Dev Session
        </h1>

        <div>
          <label className="block text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            className="mt-1 w-full rounded border border-gray-700 bg-gray-800 p-2 text-white"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />
        </div>

        {error ? (
          <p className="text-sm text-red-500">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500"
        >
          Start Session
        </button>
      </form>
    </div>
  )
}