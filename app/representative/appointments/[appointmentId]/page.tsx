import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import {
  acceptRepresentativeAppointment,
  loadRepresentativeAppointmentReview,
} from "@/domains/instruments/representative-program/application/representativeAppointmentAcceptance";
import AcceptanceForm from "./AcceptanceForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function humanize(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
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

  return (
    <main className="min-h-screen bg-[#06151b] px-6 py-10 text-[#eee7da]">
      <article className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#091a20] p-6 md:p-10">
        <Link href="/representative" className="text-sm text-[#d7b269]">
          Back to Representative Workspace
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.18em] text-[#d7b269]">
          French-Ward · Appointment Review
        </p>
        <h1 className="mt-4 text-3xl">{review.title}</h1>
        <p className="mt-3 break-words font-mono text-xs text-white/50">
          {review.instrumentReference} · Version {review.instrumentVersion}
        </p>

        <dl className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div><dt className="text-white/45">Representative</dt><dd className="mt-2">{review.displayName}</dd></div>
          <div><dt className="text-white/45">Program standing</dt><dd className="mt-2 capitalize">{humanize(review.standing)}</dd></div>
          <div><dt className="text-white/45">Appointment class</dt><dd className="mt-2 capitalize">{humanize(review.appointmentClass)}</dd></div>
          <div><dt className="text-white/45">Appointment form</dt><dd className="mt-2 capitalize">{humanize(review.appointmentForm)}</dd></div>
          <div><dt className="text-white/45">Instrument status</dt><dd className="mt-2">{review.status}</dd></div>
          <div><dt className="text-white/45">Effective date</dt><dd className="mt-2">{review.effectiveAt?.toISOString() ?? "Not established"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-white/45">Governing Master Agreement</dt><dd className="mt-2 break-words font-mono text-xs">{review.masterAgreementReference}</dd></div>
        </dl>

        <p className="mt-8 text-sm leading-7 text-white/65">
          This appointment derives from your bound Master Agreement.
          Acceptance does not activate the appointment, change Program standing,
          or create delegated authority.
        </p>

        {error ? (
          <p role="alert" className="mt-6 text-sm text-red-300">
            Acceptance could not be recorded. Review the current record and retry.
          </p>
        ) : null}

        {review.acceptedAt ? (
          <p className="mt-8 rounded-lg border border-[#c5a25f]/30 p-4 text-sm text-[#d7b269]">
            Acceptance recorded · {review.acceptedAt}
            {review.status === "DRAFT" ? " · Awaiting separate operator activation" : ""}
          </p>
        ) : review.canAccept ? (
          <AcceptanceForm action={accept} />
        ) : (
          <p className="mt-8 text-sm text-white/55">
            This appointment is not currently available for acceptance.
          </p>
        )}
      </article>
    </main>
  );
}
