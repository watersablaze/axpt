import { InstrumentStatus, InstrumentType, type PrismaClient } from "@axpt/source-authority-join"
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

export async function generateTransitionArtifacts(input: Input) {
  const { prisma } = await import("@/lib/prisma")
  return generateTransitionArtifactsWithClient(prisma, input)
}

export async function generateTransitionArtifactsWithClient(
  client: Pick<PrismaClient, "transactionDossierInstrument" | "transactionDossierEvent">,
  {
  dossierId,
  reference,
  fromState,
  toState,
  operatorEmail,
  }: Input,
) {
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
    const type = Object.values(InstrumentType).find((value) => value === artifact.type)
    const status = Object.values(InstrumentStatus).find((value) => value === artifact.status)
    if (!type || !status) {
      throw new Error(`INVALID_TRANSITION_ARTIFACT_TEMPLATE: ${artifact.type}/${artifact.status}`)
    }

    const existing =
      await client.transactionDossierInstrument.findFirst({
        where: {
          dossierId,
          type,
          version: artifact.version,
        },
      })

    const instrument =
      existing ??
      await client.transactionDossierInstrument.create({
        data: {
          dossierId,
          type,
          title: artifact.title,
          status,
          version: artifact.version,
          notes:
            `Generated from ${fromState} → ${toState} for ${reference} by ${operatorEmail}.`,
        },
      })

    const event =
      await client.transactionDossierEvent.create({
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