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
  searchParams,
}: {
  params: Promise<{ participantId: string }>;
  searchParams: Promise<{ lens?: string; focus?: string }>;
}) {
  const principal = await getPrincipal();
  const { participantId } = await params;
  const { lens, focus } = await searchParams;
  const representativeLens = lens === "representative";
  const focusView = representativeLens && focus === "1";
  if (!participantId || participantId.length > 191) notFound();

  const previewPath =
    "/admin/representative-program/participants/" +
    encodeURIComponent(participantId) +
    "/workspace-preview" +
    (representativeLens
      ? `?lens=representative${focusView ? "&focus=1" : ""}`
      : "");

  if (!principal) redirect("/login?next=" + encodeURIComponent(previewPath));
  if (!isAdmin(principal)) notFound();

  const participant = await prisma.representativeProgramParticipant.findUnique({
    where: { id: participantId },
    select: { id: true, userId: true, displayName: true },
  });
  if (!participant?.userId) notFound();

  return (
    <div className={focusView ? "fixed inset-0 z-[200] overflow-auto bg-[#061015]" : ""}>
      {!focusView ? (
      <aside
        aria-label={
          representativeLens
            ? "Representative session preview notice"
            : "Operator preview notice"
        }
        className="border-b border-amber-700/50 bg-[#211c14] px-6 py-4 text-sm text-[#eee6d7]"
      >
        <p>
          {representativeLens
            ? "Representative session preview · Read only"
            : `Operator preview · ${participant.displayName} · Read only`}
        </p>

        <p className="mt-2 text-xs text-[#c9bda9]">
          {representativeLens
            ? "This simulates the representative-facing workspace while your administrator session remains active. No representative action will be recorded."
            : "Your administrator session remains active. No representative acceptance, presentation, transmission, or authority decision is available here."}
        </p>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <Link
            href={
              representativeLens
                ? "/admin/representative-program/participants/" +
                  encodeURIComponent(participant.id) +
                  "/workspace-preview"
                : "/admin/representative-program/participants/" +
                  encodeURIComponent(participant.id) +
                  "/workspace-preview?lens=representative"
            }
            className="underline underline-offset-4"
          >
            {representativeLens
              ? "Switch to Operator Preview"
              : "View as Representative"}
          </Link>

          {representativeLens ? (
            <Link
              href={
                focusView
                  ? "/admin/representative-program/participants/" +
                    encodeURIComponent(participant.id) +
                    "/workspace-preview?lens=representative"
                  : "/admin/representative-program/participants/" +
                    encodeURIComponent(participant.id) +
                    "/workspace-preview?lens=representative&focus=1"
              }
              className="underline underline-offset-4"
            >
              {focusView ? "Exit Focus View" : "Enter Focus View"}
            </Link>
          ) : null}

          <Link
            href="/admin/representative-program"
            className="underline underline-offset-4"
          >
            Return to Representative Program administration
          </Link>
        </div>
      </aside>
      ) : (
        <div className="fixed bottom-4 right-4 z-[220]">
          <Link
            href={
              "/admin/representative-program/participants/" +
              encodeURIComponent(participant.id) +
              "/workspace-preview?lens=representative"
            }
            className="inline-flex border border-[#345661] bg-[#07171d]/95 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8eabb5] shadow-lg"
          >
            Exit Focus View
          </Link>
        </div>
      )}

      <RepresentativeWorkspaceView
        userId={participant.userId}
        operatorPreview
        representativeSessionPreview={representativeLens}
        viewportFrame={focusView}
        previewParticipantId={participant.id}
      />
    </div>
  );
}
