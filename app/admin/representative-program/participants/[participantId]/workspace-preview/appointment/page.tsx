import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import {
  loadRepresentativeAppointmentReview,
} from "@/domains/instruments/representative-program/application/representativeAppointmentAcceptance";
import styles from "../../../../../../representative/appointments/[appointmentId]/appointment.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function humanize(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

function readableTimestamp(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(new Date(value)) + " UTC";
}


export default async function OperatorAppointmentPreview({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;
  if (!participantId || participantId.length > 191) notFound();
  const base = "/admin/representative-program/participants/" +
    encodeURIComponent(participantId) + "/workspace-preview";
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=" + encodeURIComponent(base + "/appointment"));
  if (!isAdmin(principal)) notFound();

  const participant = await prisma.representativeProgramParticipant.findUnique({
    where: { id: participantId },
    select: {
      userId: true,
      appointments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  const appointmentId = participant?.appointments[0]?.id;
  if (!participant?.userId || !appointmentId) notFound();
  const review = await loadRepresentativeAppointmentReview({
    client: prisma, userId: participant.userId, appointmentId,
  });
  if (!review || review.participantId !== participantId) notFound();
  const error = null;

  const prepared = review.status === "DRAFT";
  const statusLabel = prepared
    ? review.acceptedAt
      ? "Awaiting French-Ward Activation"
      : review.canAccept
        ? "Prepared for Representative Review"
        : "Review Currently Unavailable"
    : review.status === "ACTIVE"
      ? "Active Appointment"
      : humanize(review.status);

  return (
    <main className={styles.field}>
      <div className={styles.shell}>
        <nav className={styles.navigation} aria-label="Appointment navigation">
          <Link href={base} className={styles.back}>
            <span aria-hidden="true">←</span> Operator Workspace Preview
          </Link>
          <span className={styles.navigationLabel}>Appointment Instrument</span>
        </nav>

        <article className={styles.instrument}>
          <header className={styles.crown}>
            <div className={styles.institution}>
              <p className={styles.eyebrow}>French-Ward, Inc.</p>
              <p className={styles.program}>Authorized Representation Program</p>
            </div>
            <div className={styles.headingRow}>
              <div>
                <p className={styles.overline}>Appointment Review</p>
                <h1 className={styles.title}>
                  {prepared ? "Prepared Appointment" : "Appointment Record"}
                </h1>
              </div>

            </div>
            <p className={styles.reference}>{review.instrumentReference}</p>
            <p className={styles.instrumentTitle}>{review.title}</p>
          </header>

          <div className={styles.body}>
            <section className={styles.identity} aria-labelledby="representative-name">
              <div>
                <p className={styles.overline}>
                  {prepared ? "Prepared Representative Configuration" : "Representative Configuration"}
                </p>
                <h2 id="representative-name" className={styles.name}>
                  {review.displayName}
                </h2>
                <p className={styles.classification}>
                  {humanize(review.appointmentClass)}
                </p>
              </div>
              <div className={styles.status}>
                <p className={styles.overline}>Status</p>
                <p className={styles.statusValue}>{statusLabel}</p>
              </div>
            </section>

            <dl className={styles.particulars}>
              <div>
                <dt>Appointment</dt>
                <dd className={styles.capitalize}>{review.appointmentForm === "INDIVIDUAL_REPRESENTATION" ? "Appointed individually by French-Ward, Inc." : humanize(review.appointmentForm)}</dd>
              </div>
              <div>
                <dt>Program Standing</dt>
                <dd className={styles.capitalize}>{humanize(review.standing)}</dd>
              </div>
              <div>
                <dt>Instrument State</dt>
                <dd>{review.status}</dd>
              </div>
              <div>
                <dt>Effective Date</dt>
                <dd>
                  {review.effectiveAt ? (
                    <time
                      dateTime={review.effectiveAt.toISOString()}
                      title={review.effectiveAt.toISOString()}
                    >
                      {readableTimestamp(review.effectiveAt)}
                    </time>
                  ) : "Established upon activation"}
                </dd>
              </div>
              <div className={styles.agreement}>
                <dt>Governing Master Agreement</dt>
                <dd className={styles.reference}>{review.masterAgreementReference}</dd>
              </div>
            </dl>

            <section className={styles.basis} aria-labelledby="appointment-basis">
              <p className={styles.overline}>Commercial Mandate</p>
              <h2 id="appointment-basis" className={styles.sectionTitle}>
                Scope and Conditions
              </h2>
              {review.representativeRole ? <>
                <p className={styles.prose}>{review.representativeRole.purpose}</p>
                <ul className={styles.prose} style={{ paddingLeft: 20, listStyleType: "disc" }}>
                  {review.representativeRole.activities.map(activity => <li key={activity}>{activity}</li>)}
                </ul>
                <p className={styles.prose}>{review.representativeRole.conditions}</p>
              </> : <p className={styles.prose}>
                Your appointment details are being finalized. Your materials remain available in the workspace.
              </p>}
              <div className={styles.boundary}>
                <p className={styles.boundaryTitle}>Accepting Your Appointment</p>
                <p className={styles.prose}>
                  By accepting, you confirm this role under your executed Master Agreement.
                  Your Authority Register and the controls beside each material show its available uses.
                </p>
              </div>
            </section>

            <section className={styles.decision} aria-labelledby="representative-decision">
              <p className={styles.overline}>Representative Decision</p>
              <h2 id="representative-decision" className={styles.sectionTitle}>
                {review.acceptedAt ? "Acceptance Recorded" : "Review and Acceptance"}
              </h2>

              {error ? (
                <p role="alert" className={styles.error}>
                  Acceptance could not be recorded. Review the current record and retry.
                </p>
              ) : null}

              {review.acceptedAt ? (
                <div className={styles.receipt} role="status">
                  <p className={styles.receiptHeading}>Representative action complete</p>
                  <p className={styles.prose}>
                    {prepared
                      ? "Your acceptance is recorded. Awaiting separate French-Ward activation."
                      : "Your acceptance remains recorded against this appointment configuration."}
                  </p>
                  <p className={styles.timestamp}>
                    Recorded <time dateTime={review.acceptedAt} title={review.acceptedAt}>
                      {readableTimestamp(review.acceptedAt)}
                    </time>
                  </p>
                </div>
              ) : review.canAccept ? (
                <p className={styles.prose}>Acceptance is available to the representative. This operator preview is read only.</p>
              ) : (
                <p className={styles.prose}>
                  This appointment is not currently available for acceptance.
                </p>
              )}
            </section>
          </div>

          <footer className={styles.footer}>
            Appointment acceptance, operator activation, and delegated authority
            are separate institutional decisions.
          </footer>
        </article>
      </div>
    </main>
  );
}
