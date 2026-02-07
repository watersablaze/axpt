// app/api/axpt/confirmations/escrow/[caseId]/pdf/route.ts

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
    include: {
      gates: { orderBy: { ord: 'asc' } },
      artifacts: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!c || c.status !== 'ESCROW_INITIATED') {
    return NextResponse.json(
      { ok: false, error: 'ESCROW_NOT_INITIATED' },
      { status: 400 }
    );
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 800;
  const line = (t: string, s = 11) => {
    page.drawText(t, { x: 50, y, size: s, font });
    y -= s + 6;
  };

  line('AXPT — Escrow Verification Summary', 16);
  y -= 12;

  line(`Case: ${c.title}`);
  line(`Jurisdiction: ${c.jurisdiction ?? '—'}`);
  line(`Status: ESCROW INITIATED`);
  line(`Issued (UTC): ${new Date().toISOString()}`);

  y -= 16;

  c.gates.forEach((g: any) =>
    line(`${g.name}: ${g.status}`)
  );

  y -= 16;

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(c))
    .digest('hex');

  line('Verification Hash:', 10);
  line(hash, 9);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        `attachment; filename="AXPT_Escrow_Verification_${c.id}.pdf"`,
    },
  });
}
