import { NextResponse } from 'next/server'

import {
  createInstitutionalPinRequestDependencies,
} from '@/domains/auth/institutionalPinRequestAdapter'
import {
  requestInstitutionalLoginPin,
} from '@/domains/auth/requestInstitutionalLoginPin'

const noStore = {
  'Cache-Control': 'no-store',
}

const GENERIC_RESPONSE = {
  ok: true,
  message:
    'If this address is authorized, an access code has been sent.',
}

function accepted() {
  return NextResponse.json(
    GENERIC_RESPONSE,
    {
      status: 202,
      headers: noStore,
    },
  )
}

function unavailable() {
  return NextResponse.json(
    {
      ok: false,
      error: 'AUTH_PIN_REQUEST_NOT_OPERATIONAL',
    },
    {
      status: 503,
      headers: noStore,
    },
  )
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    body = null
  }

  const record =
    typeof body === 'object' &&
    body !== null
      ? body as Record<string, unknown>
      : {}

  const now = new Date()

  let result:
    Awaited<
      ReturnType<typeof requestInstitutionalLoginPin>
    >

  try {
    result =
      await requestInstitutionalLoginPin(
        createInstitutionalPinRequestDependencies(
          now,
        ),
        record.email,
        now,
      )
  } catch (error) {
    console.error(
      '[auth/login/request] request service unavailable',
      error,
    )

    return unavailable()
  }

  if (result === 'UNAVAILABLE') {
    return unavailable()
  }

  return accepted()
}
