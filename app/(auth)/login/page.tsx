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
    requested.startsWith('/admin') &&
    !requested.startsWith('//')
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
                normalizedEmail,
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

      router.replace(
        getSafeDestination()
      )

      router.refresh()
    } catch {
      setError(
        'Unable to establish the operator session.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main
      className="
        flex min-h-screen items-center
        justify-center
        bg-[#07151c]
        px-6
        text-[#ebe7dd]
      "
    >
      <section
        className="
          w-full max-w-[430px]
          border
          border-[#394952]
          bg-[#0a1b23]
          p-8
          shadow-2xl
        "
      >
        <div
          className="
            mb-8
            border-b
            border-[#31424b]
            pb-6
          "
        >
          <p
            className="
              mb-3
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.22em]
              text-[#b99657]
            "
          >
            AXPT / Operator Access
          </p>

          <h1
            className="
              text-2xl
              font-medium
              tracking-[-0.025em]
            "
          >
            Establish session
          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-[#8d9798]
            "
          >
            Authorized operators enter
            through a short-lived
            verification code.
          </p>
        </div>

        {phase === 'email' ? (
          <form
            onSubmit={requestPin}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="
                  block
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-[#aeb4b2]
                "
              >
                Operator email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                required
                className="
                  mt-2
                  w-full
                  border
                  border-[#3b4b53]
                  bg-[#07141a]
                  px-3
                  py-3
                  text-sm
                  text-white
                  outline-none
                  transition
                  focus:border-[#9d814d]
                "
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="
                w-full
                border
                border-[#9d814d]
                bg-[#9d814d]
                px-4
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-[0.14em]
                text-[#07151c]
                transition
                hover:bg-[#b09157]
                disabled:cursor-wait
                disabled:opacity-60
              "
            >
              {busy
                ? 'Requesting…'
                : 'Request access code'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={verifyPin}
            className="space-y-5"
          >
            <div>
              <p
                className="
                  mb-4
                  text-sm
                  leading-6
                  text-[#8d9798]
                "
              >
                {message}
              </p>

              <label
                htmlFor="pin"
                className="
                  block
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-[#aeb4b2]
                "
              >
                Six-digit code
              </label>

              <input
                id="pin"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={pin}
                onChange={(event) =>
                  setPin(
                    event.target.value
                      .replace(
                        /\D/g,
                        ''
                      )
                      .slice(0, 6)
                  )
                }
                required
                autoFocus
                className="
                  mt-2
                  w-full
                  border
                  border-[#3b4b53]
                  bg-[#07141a]
                  px-3
                  py-4
                  font-mono
                  text-2xl
                  tracking-[0.28em]
                  text-white
                  outline-none
                  transition
                  focus:border-[#9d814d]
                "
              />
            </div>

            <button
              type="submit"
              disabled={
                busy ||
                pin.length !== 6
              }
              className="
                w-full
                border
                border-[#9d814d]
                bg-[#9d814d]
                px-4
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-[0.14em]
                text-[#07151c]
                transition
                hover:bg-[#b09157]
                disabled:cursor-wait
                disabled:opacity-60
              "
            >
              {busy
                ? 'Verifying…'
                : 'Establish session'}
            </button>

            <button
              type="button"
              onClick={() => {
                setPhase('email')
                setPin('')
                setError('')
                setMessage('')
              }}
              className="
                w-full
                py-2
                text-xs
                uppercase
                tracking-[0.12em]
                text-[#778487]
                hover:text-[#b9c0bd]
              "
            >
              Use another address
            </button>
          </form>
        )}

        {error ? (
          <p
            className="
              mt-5
              border-t
              border-[#573735]
              pt-4
              text-sm
              text-[#dc8c84]
            "
          >
            {error}
          </p>
        ) : null}

        <p
          className="
            mt-8
            border-t
            border-[#26373f]
            pt-5
            text-[10px]
            uppercase
            tracking-[0.13em]
            text-[#536166]
          "
        >
          Governed institutional access
        </p>
      </section>
    </main>
  )
}
