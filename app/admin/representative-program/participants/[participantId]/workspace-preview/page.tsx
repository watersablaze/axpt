import Link from "next/link";
import styles from "./workspace-preview.module.css";
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
  const { lens } = await searchParams;
  const representativeLens = lens === "representative";
  // Representative preview enters the full workspace directly; old focus links remain valid.
  const focusView = representativeLens;
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
    <div className={focusView ? styles.focusFrame : styles.previewFrame}>
      <header className={styles.toolbar} aria-label="Workspace preview controls">
        <div className={styles.identity}>
          <span className={styles.mode}>{representativeLens ? "Representative view" : "Operator review"}</span>
          <span className={styles.name}>{participant.displayName}</span>
          <span className={styles.readOnly}>Read only · Admin session</span>
        </div>
        <nav className={styles.actions} aria-label="Preview mode">
          <Link href={"/admin/representative-program/participants/" +
            encodeURIComponent(participant.id) + "/workspace-preview" +
            (representativeLens ? "" : "?lens=representative")} prefetch={false}>
            {representativeLens ? "Return to Operator Review" : "View as Representative"}
          </Link>
          <Link href="/admin/representative-program">Back to ARP</Link>
        </nav>
      </header>
      <div className={styles.content}>
      <RepresentativeWorkspaceView
        userId={participant.userId}
        operatorPreview
        representativeSessionPreview={representativeLens}
        viewportFrame={focusView}
        previewParticipantId={participant.id}
      />
      </div>
    </div>
  );
}
