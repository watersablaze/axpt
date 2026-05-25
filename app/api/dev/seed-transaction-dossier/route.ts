import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Not allowed in production' },
      { status: 403 }
    )
  }

  const dossier =
    await prisma.transactionDossier.upsert({
      where: {
        reference: 'FWI-AU-MALI-2026-001',
      },
      update: {
        title: '100 KG Trial Gold Doré Transaction',
        state: 'SPA_DRAFTING',
        commodity: 'Gold Doré Bars (AU)',
        origin: 'Republic of Mali',
        quantityKg: '100',
        refinery: 'Bedfordview Refinery',
        settlement: 'USDC ERC-20',
      },
      create: {
        reference: 'FWI-AU-MALI-2026-001',
        title: '100 KG Trial Gold Doré Transaction',
        state: 'SPA_DRAFTING',
        commodity: 'Gold Doré Bars (AU)',
        origin: 'Republic of Mali',
        quantityKg: '100',
        refinery: 'Bedfordview Refinery',
        settlement: 'USDC ERC-20',
      },
    })

  const parties = [
    {
      role: 'COORDINATOR',
      legalName: 'French-Ward Inc.',
      country: 'United States',
      notes: 'Transaction coordination entity.',
    },
    {
      role: 'COOPERATIVE',
      legalName: 'Coopérative de Bafoulabe Mali',
      country: 'Mali',
      notes: 'Seller-side cooperative structure.',
    },
    {
      role: 'BUYER',
      legalName: 'Mock Buyer Holdings Ltd',
      country: 'TBD',
      notes: 'Mock buyer for v1 transaction simulation.',
    },
    {
      role: 'REFINERY',
      legalName: 'Bedfordview Refinery',
      country: 'South Africa',
      notes: 'Intended refinery for mock dossier.',
    },
  ] as const

  for (const party of parties) {
    await prisma.transactionDossierParty.upsert({
      where: {
        id: `${dossier.id}-${party.role}`,
      },
      update: party,
      create: {
        id: `${dossier.id}-${party.role}`,
        dossierId: dossier.id,
        ...party,
      },
    })
  }

  const instruments = [
    {
      type: 'SPA',
      title: 'Sales & Purchase Agreement',
      status: 'DRAFT',
    },
    {
      type: 'ANNEX_A_DELIVERY',
      title: 'Annex A — Indicative Delivery Schedule',
      status: 'ACTIVE',
    },
    {
      type: 'ANNEX_B_SETTLEMENT',
      title: 'Annex B — Settlement Instructions',
      status: 'DRAFT',
    },
    {
      type: 'ANNEX_C_REFINERY',
      title: 'Annex C — Refinery Coordination',
      status: 'ACTIVE',
    },
    {
      type: 'ANNEX_D_COMPLIANCE',
      title: 'Annex D — Compliance Package',
      status: 'DRAFT',
    },
    {
      type: 'ANNEX_E_PROCEDURE',
      title: 'Annex E — Transaction Procedure Sheet',
      status: 'ACTIVE',
    },
  ] as const

  for (const instrument of instruments) {
    await prisma.transactionDossierInstrument.create({
      data: {
        dossierId: dossier.id,
        version: 'v1.0',
        ...instrument,
      },
    })
  }

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: dossier.id,
      eventType: 'DOSSIER_SEEDED',
      toState: 'SPA_DRAFTING',
      message:
        'Mock FWI / AXPT gold transaction dossier seeded.',
      actor: 'dev.seed',
      metadata: {
        reference: dossier.reference,
      },
    },
  })

  return NextResponse.json({
    ok: true,
    dossier,
  })
}

export async function GET() {
  return POST()
}