// app/api/axpt/cases/[caseId]/handoff/escrow/pdf/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';

export async function POST(
  _req: Request,
  { params }: { params: { caseId: string } }
) {
  const c = await prisma.case.findUnique({
    where: { id: params.caseId },
    include: { gates: true },
  });

  if (!c) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const gate4 = c.gates.find((g: any) => g.ord === 4);
  if (!gate4 || gate4.status !== 'VERIFIED') {
    return NextResponse.json(
      { ok: false, error: 'GATE_4_REQUIRED' },
      { status: 400 }
    );
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 780;
  const line = (t: string, s = 11) => {
    page.drawText(t, { x: 50, y, size: s, font });
    y -= s + 8;
  };

  line('AXPT — Escrow Handoff Declaration', 16);
  y -= 20;

  line(`Case Title: ${c.title}`);
  line(`Case ID: ${c.id}`);
  line(`Jurisdiction: ${c.jurisdiction ?? '—'}`);
  line(`Issued At (UTC): ${new Date().toISOString()}`);

  y -= 30;

  line(
    'AXPT confirms that all procedural verification gates have been completed. This declaration authorizes transition to external escrow or execution entities.',
    11
  );

  y -= 20;

  line(
    'AXPT does not custody funds, execute payments, or provide financial authorization.',
    10
  );

  const bytes = await pdf.save();
  const buffer = Buffer.from(bytes);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  const artifact = await prisma.artifact.create({
    data: {
      caseId: c.id,
      type: 'ESCROW_HANDOFF_PDF',
      name: 'Escrow Handoff Declaration',
      hash,
    },
  });

  await prisma.eventLog.create({
    data: {
      caseId: c.id,
      actor: 'AXPT_SYSTEM',
      action: 'ESCROW_HANDOFF_DECLARED',
      detail: { artifactId: artifact.id },
    },
  });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="AXPT_Escrow_Handoff_${c.id}.pdf"`,
    },
  });
}
