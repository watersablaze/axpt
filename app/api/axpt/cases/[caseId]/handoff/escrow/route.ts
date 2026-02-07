// app/api/axpt/cases/[caseId]/handoff/escrow/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertCaseCanInitiateEscrow } from '@/lib/guards/caseState';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import crypto from 'crypto';
import { PDFDocument, StandardFonts } from 'pdf-lib';

/* ───────── helpers ───────── */

function fail(code: string, status = 500, extra?: any) {
  return NextResponse.json({ ok: false, error: code, ...extra }, { status });
}

async function buildPdf(c: any): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 800;
  const line = (t: string, s = 10) => {
    page.drawText(t, { x: 50, y, size: s, font });
    y -= s + 6;
  };

  line('AXPT Escrow Summary', 16);
  y -= 10;
  line(`Case ID: ${c.id}`);
  line(`Title: ${c.title}`);
  line(`Issued At: ${new Date().toISOString()}`);
  y -= 10;

  for (const g of c.gates) {
    line(`Gate ${g.ord}: ${g.name}`, 12);
    line(`Status: ${g.status}`);
    for (const i of g.items) {
      line(`• ${i.description} — ${i.status}`, 9);
    }
    y -= 8;
  }

  return Buffer.from(await pdf.save());
}

async function zipBuffers(
  entries: { name: string; buffer: Buffer }[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on('data', (d) => chunks.push(d));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    archive.on('error', reject);
    archive.pipe(stream);

    for (const e of entries) {
      archive.append(e.buffer, { name: e.name });
    }

    archive.finalize();
  });
}

/* ───────── route ───────── */

export async function POST(
  _req: Request,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;
  if (!caseId) return fail('MISSING_CASE_ID', 400);

  try {
    const zipBuffer = await prisma.$transaction(async (tx: any) => {
      const c = await tx.case.findUnique({
        where: { id: caseId },
        include: {
          gates: {
            orderBy: { ord: 'asc' },
            include: { items: true },
          },
        },
      });

      if (!c) throw new Error('CASE_NOT_FOUND');

      // 🔐 LAW: explicit state guard
      assertCaseCanInitiateEscrow(c.status);

      const gate4 = c.gates.find((g: any) => g.ord === 4);
      if (!gate4 || gate4.status !== 'VERIFIED') {
        throw new Error('GATE_4_NOT_VERIFIED');
      }

      const pdfBuffer = await buildPdf(c);
      const pdfHash = crypto
        .createHash('sha256')
        .update(pdfBuffer)
        .digest('hex');

      const zipBuffer = await zipBuffers([
        { name: 'AXPT_Escrow_Summary.pdf', buffer: pdfBuffer },
        {
          name: 'case-summary.json',
          buffer: Buffer.from(
            JSON.stringify(
              {
                caseId: c.id,
                title: c.title,
                jurisdiction: c.jurisdiction,
                issuedAt: new Date().toISOString(),
                pdfHash,
              },
              null,
              2
            )
          ),
        },
      ]);

      const zipHash = crypto
        .createHash('sha256')
        .update(zipBuffer)
        .digest('hex');

      // 🔒 MUTATIONS BEGIN (intentional, irreversible)

      await tx.artifact.create({
        data: {
          caseId,
          type: 'ESCROW_HANDOFF_PACKET',
          name: `Escrow Handoff — ${c.title}`,
          hash: zipHash,
        },
      });

      await tx.case.update({
        where: { id: caseId },
        data: { status: 'ESCROW_INITIATED' },
      });

      await tx.eventLog.create({
        data: {
          caseId,
          actor: 'AXPT_SYSTEM',
          action: 'ESCROW_HANDOFF_INITIATED',
          detail: { pdfHash, zipHash },
        },
      });

      return zipBuffer;
    });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="AXPT_Escrow_Handoff_${caseId}.zip"`,
      },
    });
  } catch (err: any) {
    const code = err?.message ?? 'ESCROW_HANDOFF_FAILED';
    const status =
      code === 'CASE_NOT_FOUND'
        ? 404
        : code === 'CASE_NOT_ACTIVE'
        ? 409
        : code === 'ESCROW_ALREADY_INITIATED'
        ? 409
        : code === 'GATE_4_NOT_VERIFIED'
        ? 400
        : 500;

    return fail(code, status, { message: code });
  }
}
