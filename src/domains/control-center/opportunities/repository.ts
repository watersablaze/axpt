import { prisma } from '@/lib/prisma'

import type {
  OpportunityRecord,
  OpportunitySource,
  OpportunityStatus,
} from './types'

type CreateOpportunityInput = {
  title: string
  source?: OpportunitySource
  status?: OpportunityStatus
  commodity?: string | null
  buyerName?: string | null
  sellerName?: string | null
  origin?: string | null
  destination?: string | null
  quantityKg?: string | null
  notes?: string | null
}

function toOpportunityRecord(
  opportunity: {
    id: string
    title: string
    source: OpportunitySource
    status: OpportunityStatus
    commodity: string | null
    buyerName: string | null
    sellerName: string | null
    origin: string | null
    destination: string | null
    quantityKg: string | null
    notes: string | null
    dossierId: string | null
    promotedDossierId: string | null
    createdAt: Date
    updatedAt: Date
  }
): OpportunityRecord {
  return {
    id: opportunity.id,
    title: opportunity.title,
    source: opportunity.source,
    status: opportunity.status,
    commodity: opportunity.commodity,
    buyerName: opportunity.buyerName,
    sellerName: opportunity.sellerName,
    origin: opportunity.origin,
    destination: opportunity.destination,
    quantityKg: opportunity.quantityKg,
    notes: opportunity.notes,
    dossierId: opportunity.dossierId,
    promotedDossierId: opportunity.promotedDossierId,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
  }
}

export async function listOpportunities(): Promise<
  OpportunityRecord[]
> {
  const opportunities =
    await prisma.opportunity.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 25,
    })

  return opportunities.map(toOpportunityRecord)
}

export async function createOpportunity(
  input: CreateOpportunityInput
): Promise<OpportunityRecord> {
  const opportunity =
    await prisma.opportunity.create({
      data: {
        title: input.title,
        source: input.source ?? 'DIRECT',
        status: input.status ?? 'INTAKE',
        commodity: input.commodity ?? null,
        buyerName: input.buyerName ?? null,
        sellerName: input.sellerName ?? null,
        origin: input.origin ?? null,
        destination: input.destination ?? null,
        quantityKg: input.quantityKg ?? null,
        notes: input.notes ?? null,
      },
    })

  return toOpportunityRecord(opportunity)
}
