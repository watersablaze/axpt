import { prisma } from '@/lib/prisma'
import { EventTypes } from '@/core/events/types'

import {
  getTransitionRegistryEntry,
} from './transitionRegistry'

import {
  getTransitionKey,
} from './dossierApprovalGates'

type Input = {
  dossierId: string
  reference: string
  fromState: string
  toState: string
  operatorEmail: string
}

export async function generateTransitionArtifacts({
  dossierId,
  reference,
  fromState,
  toState,
  operatorEmail,
}: Input) {
  const transitionKey = getTransitionKey(
    fromState,
    toState
  )

  const registryEntry =
    getTransitionRegistryEntry(transitionKey)

  const artifactTemplates =
    registryEntry?.generatedArtifacts ?? []

  if (artifactTemplates.length === 0) {
    return []
  }

  const generatedArtifacts = []

  for (const artifact of artifactTemplates) {
    const existing =
      await prisma.transactionDossierInstrument.findFirst({
        where: {
          dossierId,
          type: artifact.type,
          version: artifact.version,
        },
      })

    const instrument =
      existing ??
      await prisma.transactionDossierInstrument.create({
        data: {
          dossierId,
          type: artifact.type,
          title: artifact.title,
          status: artifact.status,
          version: artifact.version,
          notes:
            `Generated from ${fromState} → ${toState} for ${reference} by ${operatorEmail}.`,
        },
      })

    const event =
      await prisma.transactionDossierEvent.create({
        data: {
          dossierId,
          eventType: EventTypes.INSTRUMENT_GENERATED,
          fromState: null,
          toState: null,
          message:
            `${artifact.title} generated from transition execution.`,
          actor: operatorEmail,
          metadata: {
            source: 'transition.artifact-generator',
            reference,
            transitionKey,
            instrumentId: instrument.id,
            instrumentType: instrument.type,
            fromState,
            toState,
          },
        },
      })

    generatedArtifacts.push({
      type: artifact.type,
      instrument,
      event,
    })
  }

  return generatedArtifacts
}