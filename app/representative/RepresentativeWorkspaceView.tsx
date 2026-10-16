import BuyerDossierControls from "./BuyerDossierControls";
import { loadBuyerDossierOptionsWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadBuyerDossierOptionsWithClient";
import WorkspaceStage from "./WorkspaceStage";
import WorkspaceGuide from "./WorkspaceGuide";
import CupWorkingSet from "./CupWorkingSet";
import canvas from "./workspace-canvas.module.css";
import Link from "next/link";
import AuthorityRegister from "./AuthorityRegister";
import { loadRepresentativeAuthorityRegister } from "@/domains/instruments/representative-program/application/loadRepresentativeAuthorityRegister";
import { loadRepresentativeAppointmentReview } from "@/domains/instruments/representative-program/application/representativeAppointmentAcceptance";

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

function appointmentEvidenceDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date) + " UTC";
}


export default async function RepresentativeWorkspaceView({
  userId,
  operatorPreview = false,
  previewParticipantId,
}: {
  userId: string;
  operatorPreview?: boolean;
  previewParticipantId?: string;
}) {
  if (operatorPreview && !previewParticipantId) {
    throw new Error("[ARP_OPERATOR_PREVIEW_PARTICIPANT_REQUIRED]");
  }

  const workspace =
    await loadRepresentativeWorkspace(
      userId,
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
        userId: userId,
        appointmentId: appointment.id,
      })
    : null;

  const authorityRegister = appointment
    ? await loadRepresentativeAuthorityRegister({
        client: prisma,
        appointmentId: appointment.id,
        userId: userId,
      })
    : null;

  const commercialUtilityPack =
    await loadRepresentativeCommercialUtilityPackWithClient({
      client: prisma,
      userId: userId,
    });

  const buyerDossierOptions = await loadBuyerDossierOptionsWithClient({ client: prisma, userId, pack: commercialUtilityPack });

  const reviewAvailable = Boolean(appointmentReview?.canAccept);
  const awaitingActivation = Boolean(
    appointmentReview?.acceptedAt && appointmentReview.status === "DRAFT"
  );
  const appointmentActive = appointment?.instrument.status === "ACTIVE";
  const operativeDelegation = Boolean(
    authorityRegister?.entries.some(entry =>
      entry.authority?.authorityClass === "DELEGATED" && entry.exercisable
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
        ? authorityRegister?.entries.some(entry => entry.exercisable)
          ? "Appointment established. Consult recorded authority conditions before acting."
          : "Appointment established. No authority is currently exercisable."
        : appointment
          ? "Consult your appointment record for its current institutional state."
          : "Your Program record is established. Appointment preparation is the next institutional step.";

  return (
    <main className={canvas.workspace}>
      <WorkspaceStage
        storageKey={`arp-workspace:${operatorPreview ? 'operator-preview:' : ''}${userId}:view:v1`}
        guide={<WorkspaceGuide position={currentStepCopy} />}
        identity={
          <header className={canvas.identity}>
            <div>
              <p className={canvas.kicker}>French-Ward, Inc. · Authorized Representation Program</p>
              <p className={canvas.identityName}>{workspace.displayName}</p>
            </div>
            <p className={canvas.standing}>Program standing: {humanize(workspace.standing)}</p>
          </header>
        }
        overview={<><section id="current-step" aria-labelledby="current-step-title"
                className="scroll-mt-36 border border-[#8c7855]/40 border-l-2 border-l-[#c5a25f] bg-[#13232a] px-5 py-5 md:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d7b269]">Current Step</p>
                <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 id="current-step-title" className="font-serif text-2xl leading-tight text-[#eee6d7]"><span className={appointmentActive ? canvas.activeNode : canvas.quietNode} aria-hidden="true" />{currentStepTitle}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b7c9d2]">{currentStepCopy}</p>
                  </div>
                  {reviewAvailable && appointment ? (
                    <Link href={operatorPreview ? `/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview/appointment` : `/representative/appointments/${appointment.id}`}
                      className="inline-flex shrink-0 items-center justify-center rounded border border-[#c5a25f]/60 bg-[#c5a25f]/10 px-4 py-3 text-xs font-semibold text-[#e0c490] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7b269]">
                      {operatorPreview ? "Inspect Prepared Appointment" : "Review Prepared Appointment"}
                    </Link>
                  ) : appointmentActive && commercialUtilityPack ? (
                    <a href="#field-resources" className={canvas.enterCup}>Open Your CUP ↘</a>
                  ) : null}
                </div>
              </section>
          <div className={canvas.orientation}>
            <p>Your appointment, authority record, and released materials are available through the directory.</p>
            <a href="#workspace-guide" className={canvas.guideInvitation}>Begin Orientation →</a>
          </div>
        </>}
        cup={<section id="field-resources" className={canvas.cup} aria-labelledby="cup-title">
                <header className={canvas.cupHeader}>
                  <svg className={canvas.glyph} viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <path d="M8 11h23v26H8zM16 7h23v26M12 19h15M12 25h10" />
                    <path d="m29 37 10-10M32 27h7v7" />
                  </svg>
                  <div>
                    <p className={canvas.kicker}>Your Documentary Environment</p>
                    <h2 id="cup-title" className={canvas.cupTitle}>Commercial Utility Pack {commercialUtilityPack ? <span className={canvas.version}>V{commercialUtilityPack.version}</span> : null}</h2>
                    <p className={canvas.cupIntro}>Open your materials. Consult the record before you act.</p>
                  </div>
                </header>

                {commercialUtilityPack ? (
                  <>
                    <details className={canvas.packageRecord}>
                      <summary>Package record</summary>
                      <p className={canvas.packReference}>{commercialUtilityPack.reference} · Version {commercialUtilityPack.version}</p>
                    </details>
                    <BuyerDossierControls options={buyerDossierOptions} readOnly={operatorPreview} />
                    <section
                      aria-label="Letter of Intent and Transaction Intake"
                      className="my-5 rounded-lg border border-[#425c78] bg-[#0c1929] p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#dfc58f]">
                        Commercial Intake
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        Letter of Intent &amp; Transaction Intake
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c6d3e2]">
                        Direct a prospective buyer to French-Ward’s controlled
                        commercial intake. Access and submission remain subject
                        to the intake’s separate approval process.
                      </p>
                      <Link
                        href="/french-ward/transaction-intake"
                        prefetch={false}
                        className="mt-4 inline-block text-sm font-semibold text-[#e8cb91] underline underline-offset-4"
                      >
                        Open Letter of Intent →
                      </Link>
                    </section>
                    <CupWorkingSet storageKey={`arp-workspace:${operatorPreview ? 'operator-preview:' : ''}${userId}:cup:${commercialUtilityPack.reference}:v${commercialUtilityPack.version}`} resourceIds={commercialUtilityPack.modules.flatMap(entry => entry.resources.map(resource => resource.id))} categories={commercialUtilityPack.modules.flatMap(entry =>
                      entry.resources.map(() => humanize(entry.module))
                    )} labels={commercialUtilityPack.modules.flatMap(entry =>
                      entry.resources.map(resource =>
                        resource.label || humanize(resource.resourceType)
                      )
                    )}>
                      {commercialUtilityPack.modules.flatMap(entry =>
                        entry.resources.map(resource => ({ module: entry.module, resource }))
                      ).map(({ module, resource }, index) => (
                        <article key={resource.id} className={canvas.resource}>
                          <div className={canvas.hanger} aria-hidden="true" />
                          <p className={canvas.resourceCategory}>
                            {String(index + 1).padStart(2, "0")} / {humanize(module)}
                          </p>
                          <h3 className={canvas.resourceTitle}>
                            {resource.label || humanize(resource.resourceType)}
                          </h3>
                          <p className={canvas.resourceAccess}>
                            Released for viewing · Personal download {resource.canDownload ? "permitted" : "withheld"}
                          </p>

                          {operatorPreview ? (
                            <Link
                              href={`/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview/resources/${encodeURIComponent(resource.id)}`}
                              prefetch={false}
                              className={canvas.openResource}
                            >
                              Open Resource <span aria-hidden="true">↗</span>
                            </Link>
                          ) : ((resource.resourceType === "STRUCTURED_CONTENT" &&
                              (module === "REPRESENTATION" || module === "OPERATING_BOUNDARIES")) ||
                            (["INSTITUTIONAL_INSTRUMENT", "DOCUMENT"].includes(resource.resourceType) && module === "DOCUMENTS")) ? (
                            <Link
                              href={resource.resourceType === "INSTITUTIONAL_INSTRUMENT"
                                ? `/representative/resources/${encodeURIComponent(resource.id)}/institutional`
                                : `/representative/resources/${encodeURIComponent(resource.id)}`}
                              prefetch={false}
                              className={canvas.openResource}
                            >
                              Open Resource <span aria-hidden="true">↗</span>
                            </Link>
                          ) : (
                            <p className={canvas.resourceAccess}>Viewer not yet available.</p>
                          )}

                          <details className={canvas.permissions}>
                            <summary>Use conditions</summary>
                            <p>Present: {resource.canPresent
                              ? "Requires authority and context evaluation"
                              : "Withheld"}</p>
                            <p>Transmit: {resource.canTransmit
                              ? "Requires authority and context evaluation"
                              : "Withheld"}</p>
                            <p>Resource access does not establish authority.</p>
                          </details>
                        </article>
                      ))}
                    </CupWorkingSet>
                  </>
                ) : (
                  <p className={canvas.pending}>
                    Your documentary environment will populate as resources are released for your account.
                  </p>
                )}
              </section>}
        authority={<>
          {authorityRegister ? <AuthorityRegister register={authorityRegister} /> : null}
          {!authorityRegister ? <p className={canvas.pending}>No appointment authority register is available.</p> : null}</>}
        program={<details id="program-record" className={canvas.programRecord}>
                <summary>Inspect Program Record</summary>
                <dl>
                  <div><dt>Admission</dt><dd>{displayDate(workspace.admittedAt)}</dd></div>
                  <div><dt>Program standing</dt><dd>{humanize(workspace.standing)}</dd></div>
                  <div><dt>Intake reference</dt><dd>{workspace.intakeReference ?? "—"}</dd></div>
                </dl>
              </details>}
        appointment={
          <section className={canvas.appointmentView}>
            <p className={canvas.kicker}>Institutional Instrument</p>
            <h1 className={canvas.stageTitle}>Appointment Record</h1>
            {appointment ? <>
              <p className={canvas.pending}>{appointment.instrument.title}</p>
              <dl className={canvas.plaqueFacts}>
                <div><dt>Instrument status</dt><dd>{humanize(appointment.instrument.status)}</dd></div>
                <div><dt>Effective date</dt><dd>{appointment.effectiveAt ? displayDate(appointment.effectiveAt) : "Not yet established"}</dd></div>
              </dl>
              <p className={canvas.pending}>Appointment and delegated authority remain separately governed.</p>
              {operatorPreview ? <Link className={canvas.openResource} href={`/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview/appointment`}>Inspect Appointment Instrument ↗</Link> : <Link className={canvas.openResource} href={`/representative/appointments/${appointment.id}`}>
                {reviewAvailable ? "Review and Accept Appointment" : "Inspect Appointment Instrument"} ↗
              </Link>}
            </> : <p className={canvas.pending}>Appointment preparation is pending.</p>}
          </section>
        }
        position={
          <aside key="institutional-position" className={canvas.position}>
            <p className={canvas.kicker}>Institutional Position</p>
            <p className={canvas.authorityConclusion}>
              {operativeDelegation ? "Delegated authority exercisable within recorded conditions" : "No delegated authority currently exercisable"}
            </p>
            <p className={canvas.positionNote}>Appointment and resource access do not independently establish authority.</p>
            <section id="appointment" className={canvas.plaque} aria-labelledby="appointment-plaque-title">
              <div className={canvas.plaqueInset}>
                <p className={canvas.plaqueIssuer}>French-Ward, Inc.</p>
                <p className={canvas.plaqueCategory}>
                  {appointment?.instrument.status === "DRAFT"
                    ? "Prepared Appointment"
                    : appointmentActive ? "Appointment" : "Appointment Record"}
                </p>
                <h2 id="appointment-plaque-title" className={canvas.plaqueName}>
                  {workspace.displayName}
                </h2>

                {appointment ? (
                  <>
                    <p className={canvas.plaqueDesignation}>
                      {humanize(appointment.appointmentClass)}
                    </p>
                    <dl className={canvas.plaqueFacts}>
                      <div><dt>Status</dt><dd>{humanize(appointment.instrument.status)}</dd></div>
                      <div><dt>Effective</dt><dd>{appointment.effectiveAt
                        ? displayDate(appointment.effectiveAt)
                        : appointment.instrument.status === "DRAFT" ? "Pending activation" : "Not recorded"}</dd></div>
                    </dl>
                    <p className={canvas.plaqueReference}>{appointment.instrument.reference}</p>
                    {operatorPreview ? <Link className={canvas.plaqueLink} href={`/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview/appointment`}>Inspect Record →</Link> : <Link href={`/representative/appointments/${appointment.id}`} className={canvas.plaqueLink}>
                      {reviewAvailable ? "Review and Accept" : "Inspect Record"} →
                    </Link>}
                  </>
                ) : (
                  <p className={canvas.plaqueDesignation}>Appointment not yet available.</p>
                )}
              </div>
            </section>
          </aside>
        }
      />
    </main>
  );
}
