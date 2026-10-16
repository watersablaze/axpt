import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import CommercialIntakePresentation from "../../../../../../transaction-intake/CommercialIntakePresentation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function OperatorLoiPreview({ params }: {
  params: Promise<{ participantId: string }>;
}) {
  const principal = await getPrincipal();
  const { participantId } = await params;
  if (!participantId || participantId.length > 191) notFound();
  const base = "/admin/representative-program/participants/" +
    encodeURIComponent(participantId) + "/workspace-preview";
  if (!principal) redirect("/login?next=" + encodeURIComponent(base + "/loi"));
  if (!isAdmin(principal)) notFound();
  const participant = await prisma.representativeProgramParticipant.findUnique({
    where: { id: participantId }, select: { userId: true },
  });
  if (!participant?.userId) notFound();
  return <CommercialIntakePresentation allowed readOnly backHref={base} />;
}
