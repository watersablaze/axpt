import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { sendCouncilNotification, sendSlackNotification } from '@/lib/notify';

// Allowed review actions
const ALLOWED = ['APPROVE', 'DENY', 'REQUEST_INFO'] as const;
type ReviewAction = typeof ALLOWED[number];

function decimalToNumber(d: any): number {
  if (!d && d !== 0) return 0;
  if (typeof d?.toNumber === 'function') return d.toNumber();
  return Number(d);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Must be an elder; returns { elder, user }
    const { user: actingUser } = await requireElderServer();
    const reviewerId = actingUser.id;
    const projectId = params.id;

    // Parse body
    const body = await req.json().catch(() => ({} as any));
    const action: ReviewAction = body?.action;
    const note: string | undefined = body?.note;

    // Validate action
    if (!ALLOWED.includes(action)) {
      return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
    }

    // Load project with context for notifications
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        status: true,
        requestedAxg: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!project) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    // Derive next status from action (matches ProjectStatus enum)
    const nextStatus =
      action === 'APPROVE' ? 'APPROVED' :
      action === 'DENY' ? 'DENIED' :
      'UNDER_REVIEW';

    // Apply update + record review atomically
    await prisma.$transaction([
      prisma.project.update({
        where: { id: project.id },
        data: { status: nextStatus as any },
      }),
      prisma.projectReview.create({
        data: {
          projectId: project.id,
          reviewerId,
          action, // "APPROVE" | "DENY" | "REQUEST_INFO"
          note: note ?? null,
        },
      }),
    ]);

    // Fire-and-forget notifications (don’t block the response)
    const requested = decimalToNumber(project.requestedAxg);
    const human = project.user?.name || project.user?.email || 'resident';
    const subject = `Project ${action}: ${project.title}`;
    const bodyText = [
      `Action: ${action}`,
      `Project: ${project.title}`,
      `Requester: ${human}`,
      `Requested AXG: ${requested.toFixed(2)}`,
      `Previous status: ${project.status}`,
      `Next status: ${nextStatus}`,
      note ? `Note: ${note}` : null,
      `Reviewed by: ${actingUser.email ?? actingUser.id}`,
    ].filter(Boolean).join('<br/>');

    const slackText =
      `*Project ${action}:* ${project.title}\n` +
      `Requester: ${human}\n` +
      `Requested AXG: ${requested.toFixed(2)}\n` +
      `From \`${project.status}\` → \`${nextStatus}\`` +
      (note ? `\nNote: ${note}` : '') +
      `\nReviewer: ${actingUser.email ?? actingUser.id}`;

    // Best-effort; errors are swallowed so admin UX isn’t blocked
    Promise.all([
      sendCouncilNotification(subject, bodyText).catch(() => {}),
      sendSlackNotification(slackText).catch(() => {}),
    ]).catch(() => {});

    return NextResponse.json({ ok: true, projectId, nextStatus });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Forbidden' },
      { status: 403 },
    );
  }
}