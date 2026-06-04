import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import {
  updateInstrumentStatus,
  type InstrumentStatus,
} from '@/domains/control-center/updateInstrumentStatus'

const VALID_STATUSES: InstrumentStatus[] = [
  'DRAFT',
  'ACTIVE',
  'EXECUTED',
  'ARCHIVED',
  'SUPERSEDED',
]

type Body = {
  status?: string
  note?: string
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const { id } = await context.params
  const body = (await req.json()) as Body

  if (!body.status) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_STATUS' },
      { status: 400 }
    )
  }

  if (
    !VALID_STATUSES.includes(
      body.status as InstrumentStatus
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_INSTRUMENT_STATUS',
        status: body.status,
      },
      { status: 400 }
    )
  }

  try {
    const result = await updateInstrumentStatus({
      instrumentId: id,
      status: body.status as InstrumentStatus,
      operatorEmail: principal.email,
      operatorId: null,
      note: body.note,
    })

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (err) {
    console.error(
      '[INSTRUMENT_STATUS_UPDATE_FAILED]',
      err
    )

    const message =
      err instanceof Error
        ? err.message
        : 'UNKNOWN_ERROR'

    if (message === 'INSTRUMENT_NOT_FOUND') {
      return NextResponse.json(
        { ok: false, error: message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'INSTRUMENT_STATUS_UPDATE_FAILED',
      },
      { status: 500 }
    )
  }
}