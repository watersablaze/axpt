import { prisma } from '@/lib/prisma'
import { getActiveIncidents } from './getActiveIncidents'
import { getOperationalSignals } from './getOperationalSignals'
import { getTimelineFeed } from './getTimelineFeed'
import {
  getNextDossierStates,
} from './dossierStateMachine'

export async function getOperationalState() {
  const incidents = await getActiveIncidents()
  const intelligence = getOperationalSignals(incidents)
  const timeline = await getTimelineFeed()

  const actions = await prisma.incidentActionLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  type IncidentActionRecord = (typeof actions)[number]

  const dossiers = await prisma.transactionDossier.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      parties: true,
      instruments: true,
      events: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  type DossierRecord = (typeof dossiers)[number]
  type DossierPartyRecord = DossierRecord['parties'][number]
  type DossierInstrumentRecord = DossierRecord['instruments'][number]
  type DossierEventRecord = DossierRecord['events'][number]

  return {
    generatedAt: new Date().toISOString(),

    incidents,

    intelligence,

    timeline,

    actions: actions.map((action: IncidentActionRecord) => ({
      id: action.id,
      incidentKey: action.incidentKey,
      action: action.action,
      operatorEmail: action.operatorEmail,
      operatorId: action.operatorId,
      note: action.note,
      createdAt: action.createdAt.toISOString(),
    })),

    dossiers: dossiers.map((dossier: DossierRecord) => ({
      id: dossier.id,
      reference: dossier.reference,
      title: dossier.title,
      state: dossier.state,
      nextStates: getNextDossierStates(dossier.state),
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
  }
}