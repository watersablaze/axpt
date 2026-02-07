export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import crypto from 'crypto';

export async function GET(
  _req: Request,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;

  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      gates: {
        orderBy: { ord: 'asc' },
        include: { items: true },
      },
    },
  });

  if (!c) {
    return NextResponse.json({ ok: false, error: 'CASE_NOT_FOUND' }, { status: 404 });
  }

  if (c.status !== 'ESCROW_INITIATED') {
    return NextResponse.json(
      { ok: false, error: 'ESCROW_NOT_AUTHORIZED' },
      { status: 403 }
    );
  }

  /* ───────── Deterministic Snapshot ───────── */

  const snapshot = {
    id: c.id,
    title: c.title,
    jurisdiction: c.jurisdiction,
    mode: c.mode,
    gates: c.gates.map((g: any) => ({
      ord: g.ord,
      name: g.name,
      status: g.status,
      items: g.items.map((i: any) => ({
        description: i.description,
        status: i.status,
        verifiedAt: i.verifiedAt,
      })),
    })),
  };

  const snapshotHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(snapshot))
    .digest('hex');

  /* ───────── PDF Generation ───────── */

  const doc = new PDFDocument({ margin: 50 });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  doc.pipe(stream);
  stream.on('data', c => chunks.push(c));

  // Header
  doc.fontSize(18).text('AXPT Escrow Summary', { align: 'center' }).moveDown();

  doc
    .fontSize(10)
    .fillColor('gray')
    .text(`Case ID: ${c.id}`)
    .text(`Jurisdiction: ${c.jurisdiction}`)
    .text(`Issued At: ${new Date().toISOString()}`)
    .text(`Snapshot Hash: ${snapshotHash}`)
    .moveDown();

  doc.fillColor('black');

  doc.fontSize(12).text('Case Overview', { underline: true }).moveDown(0.5);
  doc
    .fontSize(10)
    .text(`Title: ${c.title}`)
    .text(`Mode: ${c.mode}`)
    .text(`Status: ${c.status}`)
    .moveDown();

  doc.fontSize(12).text('Verification Gates', { underline: true }).moveDown(0.5);

  c.gates.forEach((gate: any) => {
    doc.fontSize(11).text(`Gate ${gate.ord}: ${gate.name}`);
    doc.fontSize(10).text(`Status: ${gate.status}`);

    gate.items.forEach((item: any) => {
      doc.text(
        `• ${item.description} — ${item.status}${
          item.verifiedAt ? ` (${item.verifiedAt.toISOString()})` : ''
        }`,
        { indent: 20 }
      );
    });

    doc.moveDown();
  });

  doc.fontSize(12).text('Procedural Notice', { underline: true }).moveDown(0.5);
  doc.fontSize(9).text(
    'This document records procedural verification status only. ' +
      'AXPT does not custody funds, execute transactions, or act as escrow agent. ' +
      'Provided for reference and verification purposes.'
  );

  doc.end();
  await new Promise(r => stream.on('end', r));

  const pdfBuffer = Buffer.concat(chunks);

  /* ───────── Persist Artifact ───────── */

  const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

  await prisma.artifact.create({
    data: {
      caseId,
      type: 'ESCROW_SUMMARY_PDF',
      name: `Escrow Summary — ${c.title}`,
      hash: pdfHash,
      notes: 'Procedural escrow summary issued after escrow authorization.',
    },
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="AXPT_Escrow_Summary_${caseId}.pdf"`,
      'X-AXPT-Snapshot-Hash': snapshotHash,
    },
  });
}
