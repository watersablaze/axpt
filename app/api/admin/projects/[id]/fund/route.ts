import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { creditAxg } from '@/lib/wallet/creditAxg';
import { sendCouncilNotification, sendSlackNotification } from '@/lib/notify';

function decimalToNumber(d: any): number {
  if (!d && d !== 0) return 0;
  if (typeof d?.toNumber === 'function') return d.toNumber();
  return Number(d);
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    // Must be an elder; returns { elder, user }
    const { elder, user: actingUser } = await requireElderServer();

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        status: true,
        requestedAxg: true,
        title: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'APPROVED') {
      return NextResponse.json(
        { ok: false, error: `Project must be APPROVED to fund (current: ${project.status})` },
        { status: 400 }
      );
    }

    // Prisma.Decimal-safe conversion
    const amount = decimalToNumber(project.requestedAxg);
    if (!(amount > 0)) {
      return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 });
    }

    // Mint/credit AXG to the project owner wallet
    await creditAxg(project.userId, amount, `Project funding: ${project.title}`);

    // Mark as FUNDED and append an audit review entry
    await prisma.$transaction([
      prisma.project.update({
        where: { id: project.id },
        data: { status: 'FUNDED' },
      }),
      prisma.projectReview.create({
        data: {
          projectId: project.id,
          reviewerId: actingUser.id,
          action: 'APPROVE_FUND', // audit label
          note: `Funded ${amount.toFixed(2)} AXG by elder ${elder.id}`,
        },
      }),
    ]);

    // Notify council (email + Slack)
    const human = project.user?.name || project.user?.email || 'resident';
    const subject = `Project FUNDED: ${project.title}`;
    const bodyText = [
      `Project: ${project.title}`,
      `Requester: ${human}`,
      `Amount: ${amount.toFixed(2)} AXG`,
      `Action: FUNDED`,
      `Actor: ${actingUser.email ?? actingUser.id}`,
    ].join('<br/>');

    const slackText =
      `*Project FUNDED:* ${project.title}\n` +
      `Requester: ${human}\n` +
      `Amount: ${amount.toFixed(2)} AXG\n` +
      `By elder: ${elder.id} (${actingUser.email ?? 'n/a'})`;

    Promise.all([
      sendCouncilNotification(subject, bodyText).catch(() => {}),
      sendSlackNotification(slackText).catch(() => {}),
    ]).catch(() => {});

    return NextResponse.json({ ok: true, funded: amount });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Forbidden' }, { status: 403 });
  }
}