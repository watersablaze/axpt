export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: Request,
  { params }: { params: { itemId: string } }
) {
  const itemId = params.itemId;

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1️⃣ Verify the item
      const item = await tx.verificationItem.update({
        where: { id: itemId },
        data: {
          status: 'VERIFIED',
          verifiedBy: 'AXPT_SYSTEM',
          verifiedAt: new Date(),
        },
        include: {
          gate: {
            include: {
              items: true,
            },
          },
        },
      });

      // 2️⃣ Check if all items in the gate are verified
      const allItemsVerified = item.gate.items.every(
        (i: any) => i.status === 'VERIFIED'
      );

      // 3️⃣ Seal the gate if complete
      if (allItemsVerified && item.gate.status !== 'VERIFIED') {
        await tx.gate.update({
          where: { id: item.gate.id },
          data: { status: 'VERIFIED' },
        });

        await tx.eventLog.create({
          data: {
            caseId: item.gate.caseId,
            actor: 'AXPT_SYSTEM',
            action: 'GATE_SEALED',
            detail: {
              gateId: item.gate.id,
              gateOrd: item.gate.ord,
            },
          },
        });
      }

      return item;
    });

    return NextResponse.json({ ok: true, item: result });
  } catch (err: any) {
    console.error('VERIFY_ITEM_FAILED', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'VERIFY_ITEM_FAILED',
        message: err?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}
