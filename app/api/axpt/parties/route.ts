// app/api/axpt/parties/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type PartyRole = 'PLAINTIFF' | 'DEFENDANT' | 'WITNESS' | 'OTHER';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const caseId = typeof body.caseId === 'string' ? body.caseId : null;
  if (!caseId) {
    return NextResponse.json({ ok: false, error: 'MISSING_caseId' }, { status: 400 });
  }

  const entityName =
    typeof body.entityName === 'string' && body.entityName.trim().length
      ? body.entityName.trim()
      : null;

  if (!entityName) {
    return NextResponse.json({ ok: false, error: 'MISSING_entityName' }, { status: 400 });
  }

  const allowedRoles: PartyRole[] = ['PLAINTIFF', 'DEFENDANT', 'WITNESS', 'OTHER'];
  const role: PartyRole = allowedRoles.includes(body.role) ? body.role : 'OTHER';

  const party = await prisma.party.create({
    data: {
      caseId,
      role,
      entityName,
      authorizedSignatory: typeof body.authorizedSignatory === 'string' ? body.authorizedSignatory.trim() : null,
      email: typeof body.email === 'string' ? body.email.trim() : null,
      phone: typeof body.phone === 'string' ? body.phone.trim() : null,
      notes: typeof body.notes === 'string' ? body.notes.trim() : null,
    },
  });

  await prisma.eventLog.create({
    data: {
      caseId,
      actor: 'AXPT_SYSTEM',
      action: 'PARTY_ADDED',
      detail: { partyId: party.id, role: party.role, entityName: party.entityName },
    },
  });

  return NextResponse.json({ ok: true, party }, { status: 201 });
}
