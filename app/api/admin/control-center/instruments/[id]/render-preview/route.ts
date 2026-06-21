import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import {
  renderDossierInstrument,
} from '@/domains/control-center/dossiers/renderDossierInstrument'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(
  _req: Request,
  context: RouteContext
) {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const { id } = await context.params

  try {
    const preview = await renderDossierInstrument({
      instrumentId: id,
    })

    return NextResponse.json({
      ok: true,
      preview,
    })
  } catch (err) {
    console.error(
      '[DOSSIER_INSTRUMENT_RENDER_PREVIEW_FAILED]',
      err
    )

    const message =
      err instanceof Error
        ? err.message
        : 'UNKNOWN_ERROR'

    if (
      message === 'INSTRUMENT_NOT_FOUND' ||
      message === 'DOSSIER_NOT_FOUND'
    ) {
      return NextResponse.json(
        { ok: false, error: message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'DOSSIER_INSTRUMENT_RENDER_PREVIEW_FAILED',
      },
      { status: 500 }
    )
  }
}
