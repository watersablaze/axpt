import Link from "next/link";
import AuthorityRegister from "./AuthorityRegister";
import { loadRepresentativeAuthorityRegister } from "@/domains/instruments/representative-program/application/loadRepresentativeAuthorityRegister";
import { loadRepresentativeAppointmentReview } from "@/domains/instruments/representative-program/application/representativeAppointmentAcceptance";
import { redirect } from "next/navigation";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { loadRepresentativeWorkspace } from "@/domains/instruments/representative-program/application/loadRepresentativeWorkspace";

import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeCommercialUtilityPackWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackWithClient";

export const dynamic = "force-dynamic";

function displayDate(
  value: Date | null,
) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
    },
  ).format(value);
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default async function RepresentativeWorkspacePage() {
  const principal =
    await getPrincipal();

  if (!principal) {
    redirect(
      "/login?next=/representative",
    );
  }

  const workspace =
    await loadRepresentativeWorkspace(
      principal.userId,
    );

  if (!workspace) {
    return (
      <main className="min-h-screen bg-[#120f0c] px-6 py-16 text-[#eee7da]">
        <section className="mx-auto max-w-3xl border border-[#443a2f] bg-[#18130f] p-8 shadow-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b99657]">
            French-Ward / Authorized Representation Program
          </p>

          <h1 className="mt-4 text-3xl font-medium tracking-[-0.03em]">
            Representative access unavailable
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#b9b0a3]">
            Your AXPT identity is authenticated, but no canonical
            Representative Program Participant record is currently
            linked to this account.
          </p>

          <div className="mt-8 border-t border-[#3a3027] pt-6 text-xs leading-6 text-[#8f8578]">
            Authentication does not establish Program admission,
            appointment, standing, or authority.
          </div>
        </section>
      </main>
    );
  }

  const appointment =
    workspace.appointment;

  const appointmentReview = appointment
    ? await loadRepresentativeAppointmentReview({
        client: prisma,
        userId: principal.userId,
        appointmentId: appointment.id,
      })
    : null;

  const authorityRegister = appointment
    ? await loadRepresentativeAuthorityRegister({
        client: prisma,
        appointmentId: appointment.id,
        userId: principal.userId,
      })
    : null;

  const commercialUtilityPack =
    await loadRepresentativeCommercialUtilityPackWithClient({
      client: prisma,
      userId: principal.userId,
    });

  const reviewAvailable = Boolean(appointmentReview?.canAccept);
  const awaitingActivation = Boolean(
    appointmentReview?.acceptedAt && appointmentReview.status === "DRAFT"
  );
  const appointmentActive = appointment?.instrument.status === "ACTIVE";
  const operativeDelegation = Boolean(
    authorityRegister?.entries.some(entry =>
      entry.authority?.authorityClass === "DELEGATED"
    )
  );
  const currentStepTitle = reviewAvailable
    ? "Representative Appointment Review"
    : awaitingActivation
      ? "Awaiting French-Ward Activation"
      : appointmentActive
        ? "Active Appointment"
        : appointment
          ? "Appointment Record"
          : "Appointment Preparation";
  const currentStepCopy = reviewAvailable
    ? "Your Appointment Instrument has been prepared. Review and record your acceptance to continue."
    : awaitingActivation
      ? "Your acceptance is recorded. Representative action is complete; French-Ward activation follows separately."
      : appointmentActive
        ? "Your appointment is active. Consult the Authority Register and released resources before undertaking an action."
        : appointment
          ? "Consult your appointment record for its current institutional state."
          : "Your Program record is established. Appointment preparation is the next institutional step.";

  return (
    <main
      className="min-h-screen bg-[#071015] text-[#e9edf0]"
      style={{
        backgroundImage: "radial-gradient(circle at 18% 8%, rgba(32,92,113,0.16), transparent 30%), radial-gradient(circle at 72% 18%, rgba(97,73,35,0.12), transparent 26%), linear-gradient(180deg, #091116 0%, #071015 60%, #060d11 100%)",
      }}
    >
      <div className="mx-auto max-w-[1600px] px-3 py-3 md:px-5 md:py-5">
        <div className="grid min-h-[calc(100vh-40px)] rounded-[24px] border border-white/[0.06] bg-[#0b1318]/90 shadow-[0_30px_120px_rgba(0,0,0,0.45)] lg:grid-cols-[minmax(0,1fr)_286px]">
          <section className="min-w-0">
            <header className="relative z-40 lg:sticky lg:top-3 mx-3 mt-3 rounded-[16px] border border-white/[0.065] bg-[#091116]/95 px-5 py-4 shadow-xl backdrop-blur-2xl md:mx-4 md:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b9985b]">French-Ward, Inc.</p>
                  <p className="mt-1 text-xs text-white/45">Authorized Representation Program</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{workspace.displayName}</p>
                  <p className="mt-1 font-mono text-xs text-white/40">{workspace.docketReference}</p>
                </div>
                <div className="rounded-full border border-[#c5a25f]/25 bg-[#c5a25f]/[0.07] px-4 py-2 text-xs text-[#d7b269]">
                  {humanize(workspace.standing)}
                </div>
              </div>
            </header>

            <div className="space-y-5 px-5 py-6 md:px-8">
              <section id="current-step" aria-labelledby="current-step-title"
                className="scroll-mt-36 border border-[#8c7855]/40 border-l-2 border-l-[#c5a25f] bg-[#13232a] px-5 py-5 md:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d7b269]">Current Step</p>
                <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 id="current-step-title" className="font-serif text-2xl leading-tight text-[#eee6d7]">{currentStepTitle}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b7c9d2]">{currentStepCopy}</p>
                  </div>
                  {reviewAvailable && appointment ? (
                    <Link href={`/representative/appointments/${appointment.id}`}
                      className="inline-flex shrink-0 items-center justify-center rounded border border-[#c5a25f]/60 bg-[#c5a25f]/10 px-4 py-3 text-xs font-semibold text-[#e0c490] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7b269]">
                      Review Prepared Appointment
                    </Link>
                  ) : null}
                </div>
              </section>
              <section id="program-record" className="scroll-mt-36 rounded-[12px] border border-white/[0.06] bg-gradient-to-br from-[#10232c] to-[#0a141a] p-5 md:p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9985b]">Representative Field</p>
                <h2 className="mt-3 text-2xl font-medium tracking-tight">Program Record</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                  Review your Program record, appointment, and released field resources.
                </p>
                <dl className="mt-5 grid gap-4 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
                  <div><dt className="text-xs text-white/40">Admission</dt><dd className="mt-2 text-sm">{displayDate(workspace.admittedAt)}</dd></div>
                  <div><dt className="text-xs text-white/40">Program standing</dt><dd className="mt-2 text-sm text-[#d7b269]">{humanize(workspace.standing)}</dd></div>
                  <div><dt className="text-xs text-white/40">Intake record</dt><dd className="mt-2 break-words font-mono text-xs">{workspace.intakeReference ?? "—"}</dd></div>
                </dl>
              </section>

              <section id="appointment" className="scroll-mt-36 rounded-[12px] border border-white/[0.06] bg-[#091a20]/65 p-5 md:p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#719baa]">Appointment Record</p>
                {appointment ? (
                  <>
                    <h2 className="mt-3 font-serif text-2xl text-[#eee6d7]">
                      {appointment.instrument.status === "DRAFT" ? "Prepared Appointment" : "Appointment Record"}
                    </h2>
                    <p className="mt-2 text-xs leading-6 text-[#a9bec9]">{appointment.instrument.title}</p>
                    <p className="mt-3 break-words font-mono text-xs text-white/45">{appointment.instrument.reference}</p>
                    <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div><dt className="text-xs text-white/40">Instrument status</dt><dd className="mt-2 text-sm">{appointment.instrument.status === "DRAFT"
                        ? awaitingActivation
                          ? "Awaiting French-Ward Activation"
                          : reviewAvailable
                            ? "Prepared for Representative Review"
                            : "Draft"
                        : humanize(appointment.instrument.status)}</dd></div>
                      <div><dt className="text-xs text-white/40">Appointment class</dt><dd className="mt-2 text-sm">{humanize(appointment.appointmentClass)}</dd></div>
                      <div><dt className="text-xs text-white/40">Appointment form</dt><dd className="mt-2 text-sm">{appointmentReview ? humanize(appointmentReview.appointmentForm) : "Unavailable"}</dd></div>
                      <div><dt className="text-xs text-white/40">Effective date</dt><dd className="mt-2 text-sm">{appointment.effectiveAt ? displayDate(appointment.effectiveAt) : "Established upon activation"}</dd></div>
                    </dl>
                    <p className="mt-5 rounded-lg border border-[#c5a25f]/25 bg-[#c5a25f]/[0.05] p-4 text-xs leading-6 text-[#d7b269]">
                      {appointmentReview?.acceptedAt
                        ? `Acceptance recorded · ${appointmentReview.acceptedAt}${
                            appointmentReview.status === "DRAFT"
                              ? " · Awaiting operator activation"
                              : ""
                          }`
                        : reviewAvailable ? "Prepared for your review and acceptance" : "No representative acceptance recorded"}
                    </p>
                    <Link href={`/representative/appointments/${appointment.id}`} className="mt-6 inline-flex rounded-lg border border-[#c5a25f]/40 bg-[#c5a25f]/[0.07] px-5 py-3 text-xs font-semibold text-[#d7b269]">{reviewAvailable ? "Review and Accept Appointment" : "View Appointment Record"}</Link>
                  </>
                ) : (
                  <>
                    <h2 className="mt-4 text-2xl font-medium">No appointment available</h2>
                    <p className="mt-4 text-sm leading-7 text-white/50">Your Program record is established. An Appointment Instrument has not yet been made available in this workspace.</p>
                  </>
                )}
              </section>

              {authorityRegister ? (
                <div id="authority-register" className="scroll-mt-36">
                  <AuthorityRegister register={authorityRegister} />
                </div>
              ) : null}

              <section id="field-resources" className="scroll-mt-36 rounded-[12px] border border-[#17323c]/80 bg-[linear-gradient(135deg,#0e1c22,#091419)] p-5 md:p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#719baa]">Representative Field Resources</p>
                <h2 className="mt-4 text-2xl font-medium">Commercial Utility Pack</h2>
                {commercialUtilityPack ? (
                  <>
                    <p className="mt-3 break-words font-mono text-xs text-white/40">{commercialUtilityPack.reference} · Version {commercialUtilityPack.version}</p>
                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                      {commercialUtilityPack.modules.map(entry => (
                        <article key={entry.module} className="rounded-[16px] border border-white/[0.06] bg-[#071319]/80 p-5">
                          <h3 className="text-sm font-medium text-[#d7b269]">{humanize(entry.module)}</h3>
                          <ul className="mt-4 space-y-5">
                            {entry.resources.map(resource => (
                              <li key={resource.id} className="border-t border-white/[0.06] pt-4">
                                <p className="text-sm">{resource.label || humanize(resource.resourceType)}</p>
                                {((resource.resourceType === "STRUCTURED_CONTENT" &&
                                    (entry.module === "REPRESENTATION" ||
                                      entry.module === "OPERATING_BOUNDARIES")) ||
                                  (resource.resourceType === "INSTITUTIONAL_INSTRUMENT" &&
                                    entry.module === "DOCUMENTS")) ? (
                                  <Link href={resource.resourceType === "INSTITUTIONAL_INSTRUMENT"
                                    ? `/representative/resources/${encodeURIComponent(resource.id)}/institutional`
                                    : `/representative/resources/${encodeURIComponent(resource.id)}`} prefetch={false} className="mt-3 inline-flex rounded-lg border border-[#527f8a]/50 bg-[#527f8a]/10 px-4 py-2 text-xs font-medium text-[#a7c6cf]">Read Resource</Link>
                                ) : null}
                                <p className="mt-3 text-xs leading-6 text-white/45">
                                  View: Permitted · Download: {resource.canDownload ? "Permitted" : "Withheld"} ·
                                  Present: {resource.canPresent ? "Requires authority and context evaluation" : "Withheld"} ·
                                  Transmit: {resource.canTransmit ? "Requires authority and context evaluation" : "Withheld"}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-5 border-l-2 border-[#527f8a]/60 bg-[#0b1920] px-4 py-4">
                    <p className="text-sm font-medium text-[#b9cfd8]">Field resources pending release</p>
                    <p className="mt-2 max-w-2xl text-xs leading-6 text-[#9fb5c0]">
                      Resources will appear here when released for your account.
                      No Commercial Utility Pack resources are currently available for viewing.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </section>

          <aside className="min-w-0 border-t border-[#17323c]/70 p-4 lg:border-l lg:border-t-0">
            <div className="lg:sticky lg:top-4 space-y-5 rounded-[12px] border border-[#17323c]/80 bg-[linear-gradient(180deg,#071117,#050d12)] p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#719baa]">Field Navigation</p>
              <nav aria-label="Representative workspace" className="flex flex-col gap-2 text-sm">
                <a href="#current-step" className="rounded-lg px-3 py-2 text-[#d7b269] hover:bg-white/[0.04]">Current Step</a>
                <a href="#program-record" className="rounded-lg px-3 py-3 text-white/70 hover:bg-white/[0.04]">Program Record</a>
                <a href="#appointment" className="rounded-lg px-3 py-3 text-white/70 hover:bg-white/[0.04]">Appointment</a>
                {authorityRegister ? <a href="#authority-register" className="rounded-lg px-3 py-2 text-white/70 hover:bg-white/[0.04]">Authority Register</a> : null}
                <a href="#field-resources" className="rounded-lg px-3 py-3 text-white/70 hover:bg-white/[0.04]">Field Resources</a>
              </nav>
              <div className="border-t border-white/[0.06] pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#719baa]">Authority Status</p>
                <p className="mt-3 text-sm font-medium leading-6 text-[#d7b269]">
                  {operativeDelegation ? "Delegated authority recorded" : "No operative delegated authority"}
                </p>
                <p className="mt-3 text-xs leading-6 text-white/50">Appointment access and Program standing do not independently establish authority. Consult each recorded authority and its conditions.</p>
              </div>
              <div className="border-t border-white/[0.06] pt-5">
                <p className="text-xs text-white/40">Program reference</p>
                <p className="mt-2 break-words font-mono text-xs text-white/65">{workspace.docketReference}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
