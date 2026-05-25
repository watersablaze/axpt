import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'

export async function GET() {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const dossiers =
    await prisma.transactionDossier.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
      include: {
        parties: true,
        instruments: true,
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    })

  type DossierRecord = (typeof dossiers)[number]

  type DossierPartyRecord =
  DossierRecord['parties'][number]

  type DossierInstrumentRecord =
  DossierRecord['instruments'][number]

  type DossierEventRecord =
  DossierRecord['events'][number]

  


  return NextResponse.json({
    ok: true,
    dossiers: dossiers.map((dossier: DossierRecord) => ({
      id: dossier.id,
      reference: dossier.reference,
      title: dossier.title,
      state: dossier.state,
      commodity: dossier.commodity,
      origin: dossier.origin,
      quantityKg: dossier.quantityKg?.toString() ?? null,
      refinery: dossier.refinery,
      settlement: dossier.settlement,
      parties: dossier.parties.map((party: DossierPartyRecord) => ({
        id: party.id,
        role: party.role,
        legalName: party.legalName,
        country: party.country,
      })),
      instruments: dossier.instruments.map(
        (instrument: DossierInstrumentRecord) => ({
        id: instrument.id,
        type: instrument.type,
        status: instrument.status,
        version: instrument.version,
        title: instrument.title,
      })),
      recentEvents: dossier.events.map((event: DossierEventRecord) => ({
        id: event.id,
        eventType: event.eventType,
        fromState: event.fromState,
        toState: event.toState,
        message: event.message,
        actor: event.actor,
        createdAt: event.createdAt.toISOString(),
      })),
      createdAt: dossier.createdAt.toISOString(),
      updatedAt: dossier.updatedAt.toISOString(),
    })),
  })
}