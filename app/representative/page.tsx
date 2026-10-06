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
            <header className="sticky top-3 z-40 mx-3 mt-3 rounded-[16px] border border-white/[0.065] bg-[#091116]/95 px-5 py-4 shadow-xl backdrop-blur-2xl md:mx-4 md:px-6">
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

            <div className="space-y-6 px-5 py-8 md:px-9">
              <section id="program-record" className="rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-[#10232c] to-[#0a141a] p-6 md:p-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#b9985b]">Representative Field</p>
                <h1 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">Your institutional workspace</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                  Review your Program record, appointment, and released field resources.
                </p>
                <dl className="mt-7 grid gap-5 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
                  <div><dt className="text-xs text-white/40">Admission</dt><dd className="mt-2 text-sm">{displayDate(workspace.admittedAt)}</dd></div>
                  <div><dt className="text-xs text-white/40">Program standing</dt><dd className="mt-2 text-sm text-[#d7b269]">{humanize(workspace.standing)}</dd></div>
                  <div><dt className="text-xs text-white/40">Intake record</dt><dd className="mt-2 break-words font-mono text-xs">{workspace.intakeReference ?? "—"}</dd></div>
                </dl>
              </section>

              <section id="appointment" className="rounded-[20px] border border-white/[0.06] bg-[#091a20]/65 p-6 md:p-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#719baa]">Appointment Record</p>
                {appointment ? (
                  <>
                    <h2 className="mt-4 text-2xl font-medium">{appointment.instrument.title}</h2>
                    <p className="mt-3 break-words font-mono text-xs text-white/45">{appointment.instrument.reference}</p>
                    <dl className="mt-6 grid gap-5 sm:grid-cols-3">
                      <div><dt className="text-xs text-white/40">Instrument status</dt><dd className="mt-2 text-sm">{humanize(appointment.instrument.status)}</dd></div>
                      <div><dt className="text-xs text-white/40">Appointment class</dt><dd className="mt-2 text-sm">{humanize(appointment.appointmentClass)}</dd></div>
                      <div><dt className="text-xs text-white/40">Effective date</dt><dd className="mt-2 text-sm">{displayDate(appointment.effectiveAt)}</dd></div>
                    </dl>
                    <p className="mt-5 rounded-lg border border-[#c5a25f]/25 bg-[#c5a25f]/[0.05] p-4 text-xs leading-6 text-[#d7b269]">
                      {appointmentReview?.acceptedAt
                        ? `Acceptance recorded · ${appointmentReview.acceptedAt}${
                            appointmentReview.status === "DRAFT"
                              ? " · Awaiting operator activation"
                              : ""
                          }`
                        : "Representative acceptance pending"}
                    </p>
                    <Link href={`/representative/appointments/${appointment.id}`} className="mt-6 inline-flex rounded-lg border border-[#c5a25f]/40 bg-[#c5a25f]/[0.07] px-5 py-3 text-xs font-semibold text-[#d7b269]">Review Appointment</Link>
                  </>
                ) : (
                  <>
                    <h2 className="mt-4 text-2xl font-medium">No appointment available</h2>
                    <p className="mt-4 text-sm leading-7 text-white/50">Your Program record is established. An Appointment Instrument has not yet been made available in this workspace.</p>
                  </>
                )}
              </section>

              {authorityRegister ? <AuthorityRegister register={authorityRegister} /> : null}

              <section id="field-resources" className="rounded-[20px] border border-[#17323c]/80 bg-[linear-gradient(135deg,#0e1c22,#091419)] p-6 md:p-8">
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
                                    ? `/api/representative/commercial-utility-packs/resources/${encodeURIComponent(resource.id)}/document`
                                    : `/representative/resources/${encodeURIComponent(resource.id)}`} prefetch={false} className="mt-3 inline-flex rounded-lg border border-[#527f8a]/50 bg-[#527f8a]/10 px-4 py-2 text-xs font-medium text-[#a7c6cf]">Read Resource</Link>
                                ) : null}
                                <p className="mt-3 text-xs leading-6 text-white/45">
                                  View: Permitted · Download: {resource.canDownload ? "Permitted" : "Withheld"} ·
                                  Present: {resource.canPresent ? "Permitted" : "Withheld"} ·
                                  Transmit: {resource.canTransmit ? "Permitted" : "Withheld"}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-white/50">No Commercial Utility Pack resources are currently released for viewing in your workspace.</p>
                )}
              </section>
            </div>
          </section>

          <aside className="min-w-0 border-t border-[#17323c]/70 p-4 lg:border-l lg:border-t-0">
            <div className="sticky top-4 space-y-5 rounded-[20px] border border-[#17323c]/80 bg-[linear-gradient(180deg,#071117,#050d12)] p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#719baa]">Field Navigation</p>
              <nav aria-label="Representative workspace" className="flex flex-col gap-2 text-sm">
                <a href="#program-record" className="rounded-lg px-3 py-3 text-white/70 hover:bg-white/[0.04]">Program Record</a>
                <a href="#appointment" className="rounded-lg px-3 py-3 text-white/70 hover:bg-white/[0.04]">Appointment</a>
                <a href="#field-resources" className="rounded-lg px-3 py-3 text-white/70 hover:bg-white/[0.04]">Field Resources</a>
              </nav>
              <div className="border-t border-white/[0.06] pt-5">
                <p className="text-xs font-medium text-[#d7b269]">Authority</p>
                <p className="mt-3 text-xs leading-6 text-white/50">Program standing, appointment status, and resource access do not establish unlimited or unrecorded authority. Authority remains separately governed.</p>
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
