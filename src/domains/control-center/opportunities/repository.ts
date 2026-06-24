import { prisma } from "@/lib/prisma";

import type {
  OpportunityRecord,
  OpportunitySource,
  OpportunityStatus,
} from "./types";

type CreateOpportunityInput = {
  title: string;
  source?: OpportunitySource;
  status?: OpportunityStatus;
  commodity?: string | null;
  buyerName?: string | null;
  sellerName?: string | null;
  origin?: string | null;
  destination?: string | null;
  quantityKg?: string | null;
  notes?: string | null;
};

type OpportunityWithSourceIntake = {
  id: string;
  title: string;
  source: OpportunitySource;
  status: OpportunityStatus;
  commodity: string | null;
  buyerName: string | null;
  sellerName: string | null;
  origin: string | null;
  destination: string | null;
  quantityKg: string | null;
  notes: string | null;
  dossierId: string | null;
  promotedDossierId: string | null;
  promotedDossier?: {
    reference: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  sourceTransactionIntake?: {
    id: string;
    reference: string;
    referralCode: string | null;
    referredByName: string | null;
    referredByCompany: string | null;
    submitterName: string;
    submitterEmail: string;
    promotedAt: Date | null;
    promotedBy: string | null;
  } | null;
};

function toOpportunityRecord(
  opportunity: OpportunityWithSourceIntake,
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
    promotedDossierReference: opportunity.promotedDossier?.reference ?? null,
    sourceIntake: opportunity.sourceTransactionIntake
      ? {
          id: opportunity.sourceTransactionIntake.id,
          reference: opportunity.sourceTransactionIntake.reference,
          referralCode: opportunity.sourceTransactionIntake.referralCode,
          referredByName: opportunity.sourceTransactionIntake.referredByName,
          referredByCompany:
            opportunity.sourceTransactionIntake.referredByCompany,
          submitterName: opportunity.sourceTransactionIntake.submitterName,
          submitterEmail: opportunity.sourceTransactionIntake.submitterEmail,
          promotedAt:
            opportunity.sourceTransactionIntake.promotedAt?.toISOString() ??
            null,
          promotedBy: opportunity.sourceTransactionIntake.promotedBy,
        }
      : null,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
  };
}

export async function listOpportunities(): Promise<OpportunityRecord[]> {
  const opportunities = await prisma.opportunity.findMany({
    include: {
      promotedDossier: {
        select: {
          reference: true,
        },
      },
      sourceTransactionIntake: {
        select: {
          id: true,
          reference: true,
          referralCode: true,
          referredByName: true,
          referredByCompany: true,
          submitterName: true,
          submitterEmail: true,
          promotedAt: true,
          promotedBy: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 25,
  });

  return opportunities.map(toOpportunityRecord);
}

export async function createOpportunity(
  input: CreateOpportunityInput,
): Promise<OpportunityRecord> {
  const opportunity = await prisma.opportunity.create({
    data: {
      title: input.title,
      source: input.source ?? "DIRECT",
      status: input.status ?? "INTAKE",
      commodity: input.commodity ?? null,
      buyerName: input.buyerName ?? null,
      sellerName: input.sellerName ?? null,
      origin: input.origin ?? null,
      destination: input.destination ?? null,
      quantityKg: input.quantityKg ?? null,
      notes: input.notes ?? null,
    },
  });

  return toOpportunityRecord(opportunity);
}
