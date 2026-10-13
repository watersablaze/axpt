import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import RepresentativeWorkspaceView from
  "../../../../../representative/RepresentativeWorkspaceView";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function OperatorWorkspacePreview({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const principal = await getPrincipal();
  const { participantId } = await params;
  if (!participantId || participantId.length > 191) notFound();

  const previewPath =
    "/admin/representative-program/participants/" +
    encodeURIComponent(participantId) + "/workspace-preview";

  if (!principal) redirect("/login?next=" + encodeURIComponent(previewPath));
  if (!isAdmin(principal)) notFound();

  const participant = await prisma.representativeProgramParticipant.findUnique({
    where: { id: participantId },
    select: { id: true, userId: true, displayName: true },
  });
  if (!participant?.userId) notFound();

  return (
    <>
      <aside aria-label="Operator preview notice"
        className="border-b border-amber-700/50 bg-[#211c14] px-6 py-4 text-sm text-[#eee6d7]">
        <p>
          Operator preview · {participant.displayName} · Read only
        </p>
        <p className="mt-2 text-xs text-[#c9bda9]">
          Your administrator session remains active. No representative
          acceptance, presentation, transmission, or authority decision is
          available here.
        </p>
        <Link href="/admin/representative-program"
          className="mt-2 inline-block underline underline-offset-4">
          Return to Representative Program administration
        </Link>
      </aside>
      <RepresentativeWorkspaceView
        userId={participant.userId}
        operatorPreview
        previewParticipantId={participant.id}
      />
    </>
  );
}
