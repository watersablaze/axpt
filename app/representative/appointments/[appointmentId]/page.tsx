import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import {
  acceptRepresentativeAppointment,
  loadRepresentativeAppointmentReview,
} from "@/domains/instruments/representative-program/application/representativeAppointmentAcceptance";
import AcceptanceForm from "./AcceptanceForm";
import styles from "./appointment.module.css";

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

export default async function AppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ appointmentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { appointmentId } = await params;
  const principal = await getPrincipal();
  const path = `/representative/appointments/${encodeURIComponent(appointmentId)}`;

  if (!principal) redirect(`/login?next=${encodeURIComponent(path)}`);

  const review = await loadRepresentativeAppointmentReview({
    client: prisma,
    userId: principal.userId,
    appointmentId,
  });
  if (!review) notFound();

  const { error } = await searchParams;
  const reviewHash = review.reviewHash;

  async function accept(formData: FormData) {
    "use server";

    const actor = await getPrincipal();
    if (!actor) redirect(`/login?next=${encodeURIComponent(path)}`);

    let failed = false;
    try {
      await acceptRepresentativeAppointment({
        client: prisma,
        userId: actor.userId,
        appointmentId,
        reviewHash,
        confirmAcceptance: formData.get("confirmAcceptance") === "yes",
      });
    } catch {
      failed = true;
    }

    redirect(failed ? `${path}?error=acceptance` : path);
  }

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
          <Link href="/representative" className={styles.back}>
            <span aria-hidden="true">←</span> Representative Workspace
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
              <p className={styles.version}>Version {review.instrumentVersion}</p>
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
                <dt>Appointment Form</dt>
                <dd className={styles.capitalize}>{humanize(review.appointmentForm)}</dd>
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

            {review.status === "ACTIVE" &&
              review.standing === "ACTIVE" &&
              review.acceptedAt &&
              review.effectiveAt &&
              review.effectiveAt.getTime() <= Date.now() &&
              review.endedAt === null &&
              (!review.expiresAt ||
                new Date(review.expiresAt).getTime() > Date.now()) ? (
              <section className={styles.basis} aria-labelledby="appointment-certificate">
                <p className={styles.overline}>Presentable Record</p>
                <h2 id="appointment-certificate" className={styles.sectionTitle}>
                  Certificate of Appointment
                </h2>
                <p className={styles.prose}>
                  A documentary copy of your recorded appointment.
                  Delegated authority remains separately governed.
                </p>
                <a
                  href={`/api/representative/appointments/${encodeURIComponent(appointmentId)}/credential`}
                  className={styles.back}
                  style={{ display: "inline-flex", marginTop: 18 }}
                >
                  Download Certificate · PDF
                </a>
              </section>
            ) : null}

            <section className={styles.basis} aria-labelledby="appointment-basis">
              <p className={styles.overline}>Appointment Basis</p>
              <h2 id="appointment-basis" className={styles.sectionTitle}>
                Derived from your executed Master Agreement
              </h2>
              <p className={styles.prose}>
                This Appointment Instrument derives from your bound
                Representative Program Master Agreement. Acceptance records
                your acknowledgement of the prepared appointment configuration.
              </p>
              <div className={styles.boundary}>
                <p className={styles.boundaryTitle}>Effect of Acceptance</p>
                <p className={styles.prose}>
                  Acceptance does not activate the appointment, change Program
                  standing, or independently create delegated authority.
                  {review.status === "ACTIVE"
                    ? "French-Ward activation is recorded. Delegated authority remains separately governed."
                    : prepared
                      ? "French-Ward activation requires a separate operator decision."
                      : "Appointment status and delegated authority remain separately governed."}
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
                <AcceptanceForm action={accept} />
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
