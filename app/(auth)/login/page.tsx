'use client'

import {
  FormEvent,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'

type Phase = 'email' | 'pin'

function getSafeDestination() {
  if (typeof window === 'undefined') {
    return '/admin/control-center'
  }

  const params =
    new URLSearchParams(
      window.location.search
    )

  const requested =
    params.get('next')

  if (
    requested &&
    !requested.startsWith('//') &&
    (
      requested.startsWith('/admin') ||
      requested.startsWith('/representative')
    )
  ) {
    return requested
  }

  return '/admin/control-center'
}

export default function LoginPage() {
  const router = useRouter()

  const [phase, setPhase] =
    useState<Phase>('email')

  const [email, setEmail] =
    useState('')

  const [pin, setPin] =
    useState('')

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [busy, setBusy] =
    useState(false)

  const normalizedEmail =
    useMemo(
      () =>
        email
          .trim()
          .toLowerCase(),
      [email]
    )

  async function requestPin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (busy) return

    const emailField =
      event.currentTarget.elements.namedItem('email')

    if (!(emailField instanceof HTMLInputElement)) {
      setError('Please enter your email address.')
      return
    }

    const submittedEmail =
      emailField.value.trim().toLowerCase()

    if (!submittedEmail || !emailField.checkValidity()) {
      setError('Please enter a valid email address.')
      emailField.focus()
      return
    }

    setEmail(submittedEmail)

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const response =
        await fetch(
          '/api/auth/login/request',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              email:
                submittedEmail,
            }),
          }
        )

      if (!response.ok) {
        throw new Error(
          'Unable to request access code.'
        )
      }

      setPhase('pin')
      setMessage(
        'If this address is authorized, a verification code has been sent.'
      )
    } catch {
      setError(
        'Unable to request an access code. Please try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function verifyPin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setBusy(true)
    setError('')

    try {
      const response =
        await fetch(
          '/api/auth/login/verify',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              email:
                normalizedEmail,
              pin,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.error ??
            'Invalid or expired access code.'
        )

        return
      }

      const requestedDestination = getSafeDestination()
      const requestedPath = requestedDestination.split(/[?#]/)[0]

      const visitorDestination = [
        '/french-ward',
        '/french-ward/transaction-intake',
        '/transaction-intake',
      ].includes(requestedPath)
        ? requestedDestination
        : '/french-ward'

      const destination =
        data.audience === 'REPRESENTATIVE'
          ? (
              requestedDestination.startsWith('/representative')
                ? requestedDestination
                : '/representative'
            )
          : data.audience === 'INSTITUTIONAL_VISITOR'
            ? visitorDestination
            : data.audience === 'ADMIN'
              ? (
                  requestedDestination.startsWith('/admin')
                    ? requestedDestination
                    : '/admin/control-center'
                )
              : '/french-ward'

      router.replace(destination)

      router.refresh()
    } catch {
      setError(
        'Unable to establish the institutional session.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071218] px-5 py-10 text-[#e8edf0]"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(43,87,109,0.16), transparent 65%)' }}>
      <section aria-labelledby="access-title"
        className="w-full max-w-[480px] overflow-hidden rounded-xl border border-[#32444e] bg-[#0b1a22] shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
        <header className="border-b border-[#32444e] bg-[#10232c] px-7 pb-7 pt-8 sm:px-9">
          <div className="flex items-center justify-between gap-5 border-b border-[#b99657]/20 pb-5">
            <p className="text-sm font-semibold tracking-[0.24em] text-[#d6b77f]">AXPT</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#9fb9c5]">Institutional Access</p>
          </div>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#9fb9c5]">
            {phase === 'email' ? 'Private Access Gateway' : 'Identity Verification'}
          </p>
          <h1 id="access-title" className="mt-3 font-serif text-[30px] leading-tight tracking-[-0.02em] text-[#eee6d7]">
            {phase === 'email' ? 'Institutional Access' : 'Verify Your Identity'}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#b7c9d2]">
            {phase === 'email'
              ? 'Authenticate your institutional identity to continue into your assigned environment.'
              : 'Enter the six-digit access code to establish your institutional session.'}
          </p>
        </header>

        <div className="px-7 py-7 sm:px-9">
          <ol aria-label="Access progress" className="mb-7 grid grid-cols-2 gap-3 text-[10px] uppercase tracking-[0.12em]">
            <li className={phase === 'email'
              ? 'border-b border-[#c5a16b] pb-3 text-[#dec597]'
              : 'border-b border-[#476574] pb-3 text-[#a9c2cd]'}
              aria-current={phase === 'email' ? 'step' : undefined}>01 · Identity</li>
            <li className={phase === 'pin'
              ? 'border-b border-[#c5a16b] pb-3 text-[#dec597]'
              : 'border-b border-[#2b414d] pb-3 text-[#91a8b4]'}
              aria-current={phase === 'pin' ? 'step' : undefined}>02 · Verification</li>
          </ol>

          {phase === 'email' ? (
            <form onSubmit={requestPin} className="space-y-5" aria-busy={busy}>
              <div>
                <label htmlFor="email" className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9c0cc]">
                  Institutional Email
                </label>
                <input id="email" name="email" type="email" autoComplete="email"
                  value={email} onChange={event => setEmail(event.target.value)} required
                  className="mt-3 w-full rounded border border-[#405866] bg-[#07141b] px-4 py-3.5 text-base text-[#e8edf0] outline-none transition focus:border-[#d1b17a] focus:ring-1 focus:ring-[#d1b17a]" />
              </div>
              <button type="submit" disabled={busy}
                className="w-full rounded border border-[#d1b17a] bg-[#c2a16b] px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0b1720] transition hover:bg-[#d3b780] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d1b17a] disabled:cursor-wait disabled:opacity-60">
                {busy ? 'Requesting…' : 'Request Access Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyPin} className="space-y-5" aria-busy={busy}>
              <div className="border-l-2 border-[#719baa] bg-[#10232b] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#9fb9c5]">Requested For</p>
                <p className="mt-1 break-all text-sm text-[#d7e3e9]">{normalizedEmail}</p>
                <p role="status" className="mt-2 text-xs leading-6 text-[#a9c0cb]">{message}</p>
              </div>
              <div>
                <label htmlFor="pin" className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9c0cc]">Six-Digit Code</label>
                <input id="pin" type="text" inputMode="numeric" autoComplete="one-time-code"
                  pattern="[0-9]{6}" maxLength={6} value={pin}
                  onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required autoFocus
                  className="mt-3 w-full rounded border border-[#405866] bg-[#07141b] px-4 py-4 text-center font-mono text-2xl tracking-[0.35em] text-[#e8edf0] outline-none transition focus:border-[#d1b17a] focus:ring-1 focus:ring-[#d1b17a]" />
              </div>
              <button type="submit" disabled={busy || pin.length !== 6}
                className="w-full rounded border border-[#d1b17a] bg-[#c2a16b] px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0b1720] transition hover:bg-[#d3b780] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d1b17a] disabled:cursor-wait disabled:opacity-60">
                {busy ? 'Verifying…' : 'Continue to Workspace'}
              </button>
              <button type="button" disabled={busy} onClick={() => {
                setPhase('email')
                setPin('')
                setError('')
                setMessage('')
              }}
                className="w-full rounded py-2 text-xs text-[#a9c0cb] underline underline-offset-4 hover:text-[#e0c490] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d1b17a] disabled:opacity-50">
                Use Another Address
              </button>
            </form>
          )}

          {error ? (
            <p role="alert" className="mt-5 rounded border border-[#75524f] bg-[#291d21]/40 px-4 py-3 text-sm leading-6 text-[#f0b4aa]">{error}</p>
          ) : null}
        </div>

        <footer className="border-t border-[#293f4b] px-7 py-4 text-[10px] leading-6 text-[#9bb1bc] sm:px-9">
          Private institutional access · Assigned environments remain governed.
        </footer>
      </section>
    </main>
  )
}
