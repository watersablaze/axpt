// app/api/axpt/confirmations/gate/[gateId]/pdf/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';

const gatePurposeByOrd: Record<number, string> = {
  1: 'Party identity and authority verification',
  2: 'Transaction alignment and term acknowledgment',
  3: 'Operational and system readiness confirmation',
  4: 'Procedural readiness confirmation',
};

export async function POST(
  _req: Request,
  { params }: { params: { gateId: string } }
) {
  try {
    const gate = await prisma.gate.findUnique({
      where: { id: params.gateId },
      include: { case: true },
    });

    if (!gate) {
      return NextResponse.json({ ok: false, error: 'Gate not found' }, { status: 404 });
    }

    if (gate.status !== 'VERIFIED') {
      return NextResponse.json({ ok: false, error: 'Gate not verified' }, { status: 400 });
    }

    // -------- PDF --------
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 800;
    const line = (text: string, size = 11) => {
      page.drawText(text, { x: 50, y, size, font });
      y -= size + 6;
    };

    line('AXPT — Coordination & Verification Layer', 16);
    y -= 10;

    line(`${gate.name} Confirmation`, 14);
    y -= 20;

    line(`Purpose: ${gatePurposeByOrd[gate.ord] ?? 'Procedural verification'}`);
    y -= 20;

    line(`Case Title: ${gate.case.title}`);
    line(`Case ID: ${gate.case.id}`);
    line(`Jurisdiction: ${gate.case.jurisdiction ?? '—'}`);
    line(`Mode: ${gate.case.mode}`);
    y -= 10;

    line(`Gate Status: VERIFIED`);
    line(`Issued At (UTC): ${new Date().toISOString()}`);
    y -= 20;

    line(
      'This document confirms that all verification items associated with the above gate have been completed and verified within the AXPT coordination framework.'
    );
    y -= 20;

    line(
      'This confirmation does not authorize, instruct, approve, or execute the movement of funds. All financial execution occurs exclusively through licensed institutions or legal escrow entities.',
      10
    );
    y -= 30;

    line('Officer Attribution', 12);
    y -= 6;
    line(`Officer: ${process.env.AXPT_OFFICER_NAME ?? 'AXPT Officer'}`);
    line(`Title: ${process.env.AXPT_OFFICER_TITLE ?? 'Process Authority'}`);
    line(`Email: ${process.env.AXPT_OFFICER_EMAIL ?? '—'}`);
    y -= 20;
    line('Signature: ________________________________');

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    const verificationToken = crypto.randomBytes(24).toString('hex');

    const artifact = await prisma.artifact.create({
      data: {
        caseId: gate.caseId,
        type: 'GATE_CONFIRMATION_PDF',
        name: `${gate.name} Confirmation`,
        hash,
        notes: 'Procedural verification confirmation. Non-financial.',
      },
    });

    await prisma.publicVerification.create({
      data: {
        id: verificationToken,
        caseId: gate.caseId,
        artifactId: artifact.id,
        hash,
      },
    });

    await prisma.eventLog.create({
      data: {
        caseId: gate.caseId,
        actor: 'AXPT_SYSTEM',
        action: 'GATE_CONFIRMATION_PDF_ISSUED',
        detail: { gateId: gate.id, artifactId: artifact.id },
      },
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="AXPT_${gate.name.replace(/\s+/g, '_')}.pdf"`,
        'X-Verification-Token': verificationToken,
      },
    });
  } catch (err: any) {
    console.error('PDF generation failed:', err);
    return NextResponse.json(
      { ok: false, error: 'PDF_GENERATION_FAILED', message: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}