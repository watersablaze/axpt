import Link from "next/link";
import { redirect } from "next/navigation";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { loadRepresentativeWorkspace } from "@/domains/instruments/representative-program/application/loadRepresentativeWorkspace";

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

  return (
    <main className="min-h-screen bg-[#120f0c] text-[#eee7da]">
      <header className="border-b border-[#342b23] bg-[#16110d] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b99657]">
              French-Ward, Inc.
            </p>
            <p className="mt-1 text-sm text-[#b8aea1]">
              Authorized Representation Program
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-[#887e72]">
              Representative Workspace
            </p>
            <p className="mt-1 text-sm">
              {workspace.displayName}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="border border-[#453a30] bg-[#19140f] p-8 shadow-xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b99657]">
                Program Record
              </p>

              <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em]">
                {workspace.displayName}
              </h1>

              <p className="mt-3 font-mono text-xs text-[#8d8377]">
                {workspace.docketReference}
              </p>
            </div>

            <div className="border border-[#594937] px-5 py-4 md:min-w-52">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8e8376]">
                Program standing
              </p>

              <p className="mt-2 text-lg text-[#d8c39b]">
                {humanize(
                  workspace.standing,
                )}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-[#392f27] pt-7 md:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#7f766b]">
                Admission
              </p>
              <p className="mt-2 text-sm">
                {displayDate(
                  workspace.admittedAt,
                )}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#7f766b]">
                Intake reference
              </p>
              <p className="mt-2 font-mono text-xs">
                {workspace.intakeReference ??
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#7f766b]">
                Participant ID
              </p>
              <p className="mt-2 font-mono text-xs text-[#aaa093]">
                {workspace.participantId}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-7 lg:grid-cols-2">
          <article className="border border-[#40362d] bg-[#17120e] p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b99657]">
              Appointment Instrument
            </p>

            {appointment ? (
              <>
                <h2 className="mt-4 text-xl font-medium">
                  {appointment.instrument.title}
                </h2>

                <dl className="mt-6 space-y-4 text-sm">
                  <div className="flex justify-between gap-5 border-b border-[#302820] pb-3">
                    <dt className="text-[#81786e]">
                      Reference
                    </dt>
                    <dd className="font-mono text-xs text-right">
                      {appointment.instrument.reference}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-5 border-b border-[#302820] pb-3">
                    <dt className="text-[#81786e]">
                      Instrument status
                    </dt>
                    <dd>
                      {humanize(
                        appointment.instrument.status,
                      )}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-5 border-b border-[#302820] pb-3">
                    <dt className="text-[#81786e]">
                      Appointment class
                    </dt>
                    <dd className="text-right">
                      {humanize(
                        appointment.appointmentClass,
                      )}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-5 border-b border-[#302820] pb-3">
                    <dt className="text-[#81786e]">
                      Effective
                    </dt>
                    <dd>
                      {displayDate(
                        appointment.effectiveAt,
                      )}
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/representative/appointments/${appointment.id}`}
                  className="mt-7 inline-flex border border-[#9d814d] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#d9c397]"
                >
                  Review Appointment
                </Link>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-xl font-medium">
                  No appointment issued
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#9d9387]">
                  Your Program record is established, but no Appointment
                  Instrument is presently available in this workspace.
                </p>
              </>
            )}
          </article>

          <article className="border border-[#40362d] bg-[#17120e] p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b99657]">
              Authority
            </p>

            <h2 className="mt-4 text-xl font-medium">
              Authority presentation
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#9d9387]">
              Authority will be presented separately from Program
              standing and appointment status. Appointment does not
              itself establish unlimited or unrecorded authority.
            </p>

            <div className="mt-6 border-t border-[#302820] pt-5">
              <p className="text-xs leading-6 text-[#766e65]">
                AUTHORITY RECORDED ≠ AUTHORITY EXERCISABLE
              </p>
            </div>
          </article>
        </section>

        <section className="mt-7 border border-[#342c24] bg-[#15110d] p-6">
          <p className="text-xs leading-6 text-[#867d72]">
            This workspace presents the canonical Program record
            associated with your authenticated AXPT identity.
            Authentication does not independently create, expand, or
            modify appointment, standing, mandate, or authority.
          </p>
        </section>
      </div>
    </main>
  );
}
