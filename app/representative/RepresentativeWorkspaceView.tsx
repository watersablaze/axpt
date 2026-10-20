import CupTimingCheck from "./CupTimingCheck";
import CupMaterialUse from "./CupMaterialUse";
import cupStyles from "./cup-reading.module.css";
import CupMaterialReader from "./CupMaterialReader";
import { loadRepresentativeAppointmentWorkspaceDetailsWithClient } from "@/domains/instruments/representative-program/application/loadRepresentativeAppointmentWorkspaceDetailsWithClient";
import BuyerDossierControls from "./BuyerDossierControls";
import { loadBuyerDossierOptionsBatchedWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadBuyerDossierOptionsBatchedWithClient";
import WorkspaceStage from "./WorkspaceStage";
import WorkspaceGuide from "./WorkspaceGuide";
import FieldCommunications from "./FieldCommunications";
import CupWorkingSet from "./CupWorkingSet";
import canvas from "./workspace-canvas.module.css";
import Link from "next/link";
import AuthorityRegister from "./AuthorityRegister";
import RepresentativeSessionControl from "./RepresentativeSessionControl";

import { loadRepresentativeWorkspaceSnapshotWithClient } from "@/domains/instruments/representative-program/application/loadRepresentativeWorkspaceSnapshotWithClient";

import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeCommercialUtilityPackSnapshotWithClient as loadRepresentativeCommercialUtilityPackWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackSnapshotWithClient";








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
  representativeSessionPreview = false,
  viewportFrame = false,
  previewParticipantId,
}: {
  userId: string;
  operatorPreview?: boolean;
  representativeSessionPreview?: boolean;
  viewportFrame?: boolean;
  previewParticipantId?: string;
}) {
  if (operatorPreview && !previewParticipantId) {
    throw new Error("[ARP_OPERATOR_PREVIEW_PARTICIPANT_REQUIRED]");
  }

  if (representativeSessionPreview && !operatorPreview) {
    throw new Error("[ARP_REPRESENTATIVE_SESSION_PREVIEW_REQUIRES_OPERATOR_PREVIEW]");
  }

  const representativePreviewLens =
    operatorPreview && representativeSessionPreview;

  const representativePreviewQuery =
    representativePreviewLens ? "?lens=representative" : "";

  const representativePreviewContinuation =
    representativePreviewLens ? "&lens=representative" : "";

  const [workspace, commercialUtilityPack] =
    await Promise.all([
      loadRepresentativeWorkspaceSnapshotWithClient({
        client: prisma,
        userId,
      }),
      loadRepresentativeCommercialUtilityPackWithClient({
        client: prisma,
        userId,
      }),
    ]);

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

  const [appointmentDetails, buyerDossierOptions, readerInstruments] =
    await Promise.all([
      appointment
        ? loadRepresentativeAppointmentWorkspaceDetailsWithClient({
            client: prisma,
            userId,
            appointmentId: appointment.id,
          })
        : Promise.resolve({
            appointmentReview: null,
            authorityRegister: null,
          }),
      loadBuyerDossierOptionsBatchedWithClient({
        client: prisma,
        userId,
        pack: commercialUtilityPack,
      }),
      prisma.institutionalInstrument.findMany({
        where: { id: { in: commercialUtilityPack?.modules.flatMap(entry =>
          entry.resources.filter(resource => resource.resourceType === "INSTITUTIONAL_INSTRUMENT")
            .map(resource => resource.resourceId)) ?? [] } },
        select: { id: true, kind: true },
      }),
    ]);
  // Presentation routing only. Every document endpoint still authorizes the request.
  const agreementIds = new Set(readerInstruments
    .filter(instrument => instrument.kind === "REPRESENTATIVE_PROGRAM_AGREEMENT")
    .map(instrument => instrument.id));

  const { appointmentReview, authorityRegister } = appointmentDetails;

  const releasedCupMaterialCount =
    commercialUtilityPack?.modules.reduce(
      (count, entry) => count + entry.resources.length,
      0,
    ) ?? 0;

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
    <main
      className={[
        canvas.workspace,
        viewportFrame ? canvas.viewportFrame : "",
      ].filter(Boolean).join(" ")}
    >
      <WorkspaceStage
        storageKey={`arp-workspace:${operatorPreview ? 'operator-preview:' : ''}${userId}:view:v1`}
        guide={<WorkspaceGuide position={currentStepCopy} />}
        communications={
          <FieldCommunications
            previewMode={operatorPreview}
            previewParticipant={{
              docketReference: workspace.docketReference,
              displayName: workspace.displayName,
            }}
          />
        }
        identity={
          <div className={canvas.workspaceCommandHeader}>
            <section className={canvas.commandIdentity}>
              <img
                src="/FW/french-ward_V3.2.png"
                alt=""
                aria-hidden="true"
                className={canvas.workspaceSeal}
              />

              <div className={canvas.commandIdentityText}>
                <p className={canvas.kicker}>
                  French-Ward, Inc. · Authorized Representation Program
                </p>

                <p className={canvas.identityName}>
                  {workspace.displayName}
                </p>

                <p className={canvas.commandStanding}>
                  Program standing · {humanize(workspace.standing)}
                </p>
              </div>
            </section>

            <section className={canvas.commandAccess}>
              {operatorPreview && !representativeSessionPreview ? (
                <div className={canvas.commandOperatorPreview}>
                  <p className={canvas.commandMicroLabel}>
                    Operator Preview
                  </p>

                  <p>
                    No representative session is active.
                  </p>
                </div>
              ) : (
                <RepresentativeSessionControl
                  readOnlyPreview={representativeSessionPreview}
                />
              )}
            </section>
          </div>
        }
        overview={
          <section
            className={canvas.workspaceGuidance}
            aria-label="Workspace guidance"
          >
            <div className={canvas.workspaceGuidanceInner}>
              <p className={canvas.workspaceGuidancePrimary}>
                This is your workspace.
              </p>

              <p className={canvas.workspaceGuidanceFocus}>
                Bring your work into focus.
              </p>

              <p className={canvas.workspaceGuidanceSecondary}>
                Move through the directory as the work requires.
              </p>
            </div>
          </section>
        }
        cup={<section id="field-resources" className={cupStyles.cup} aria-labelledby="cup-title">
                {process.env.NODE_ENV === "development" && commercialUtilityPack ? <CupTimingCheck
                  materials={commercialUtilityPack.modules.flatMap(entry => entry.resources.map(resource => {
                    const pdf = resource.resourceType === "DOCUMENT" || agreementIds.has(resource.resourceId);
                    const api = operatorPreview
                      ? `/api/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview/resources/${encodeURIComponent(resource.id)}`
                      : `/api/representative/commercial-utility-packs/resources/${encodeURIComponent(resource.id)}`;
                    const query = new URLSearchParams();
                    if (operatorPreview && previewParticipantId) query.set("previewParticipantId", previewParticipantId);
                    if (resource.resourceType === "STRUCTURED_CONTENT") query.set("renderer", "structured");
                    if (resource.resourceType === "INSTITUTIONAL_INSTRUMENT") query.set("renderer", "institutional");
                    return { id: resource.id, label: resource.label || humanize(resource.resourceType),
                      format: pdf ? "pdf" as const : "html" as const,
                      href: pdf ? api + (resource.resourceType === "DOCUMENT" ? "/supporting-document?mode=inline" : "/document?mode=inline")
                        : `/representative/materials/${encodeURIComponent(resource.id)}/reader?${query.toString()}` };
                  }))} /> : null}
                <header className={cupStyles.cupHeader}>
                  <div className={cupStyles.cupHeaderMark} aria-hidden="true">
                    <svg className={cupStyles.glyph} viewBox="0 0 48 48" fill="none">
                      <path d="M8 11h23v26H8zM16 7h23v26M12 19h15M12 25h10" />
                      <path d="m29 37 10-10M32 27h7v7" />
                    </svg>
                  </div>

                  <div className={cupStyles.cupHeading}>
                    <p className={cupStyles.kicker}>Your Documentary Environment</p>

                    <div className={cupStyles.cupTitleLine}>
                      <h2 id="cup-title" className={cupStyles.cupTitle}>
                        Commercial Utility Pack
                      </h2>

                      {commercialUtilityPack ? (
                        <span className={cupStyles.version}>
                          V{commercialUtilityPack.version}
                        </span>
                      ) : null}
                    </div>

                    <p className={cupStyles.cupIntro}>
                      Released institutional materials for governed representative use.
                    </p>
                    {commercialUtilityPack ? (
<details className={cupStyles.packageRecord}>
                            <summary>Package Record</summary>
                            <dl>
                              <div>
                                <dt>Reference</dt>
                                <dd>{commercialUtilityPack.reference}</dd>
                              </div>
                              <div>
                                <dt>Version</dt>
                                <dd>{commercialUtilityPack.version}</dd>
                              </div>
                            </dl>
                          </details>
                    ) : null}
                  </div>

                  {commercialUtilityPack ? (
                    <div className={cupStyles.cupReleaseSummary}>
                      <span>{releasedCupMaterialCount}</span>
                      <small>Released Materials</small>
                    </div>
                  ) : null}
                </header>

                {commercialUtilityPack ? (
                  <>


                    <CupWorkingSet
                      storageKey={`arp-workspace:${operatorPreview ? 'operator-preview:' : ''}${userId}:cup:${commercialUtilityPack.reference}:v${commercialUtilityPack.version}`}
                      resourceIds={commercialUtilityPack.modules.flatMap(entry =>
                        entry.resources.map(resource => resource.id)
                      )}
                      categories={commercialUtilityPack.modules.flatMap(entry =>
                        entry.resources.map(() => humanize(entry.module))
                      )}
                      labels={commercialUtilityPack.modules.flatMap(entry =>
                        entry.resources.map(resource =>
                          resource.label || humanize(resource.resourceType)
                        )
                      )}
                      sidebar={
                        <div className={cupStyles.commercialTools}>
                          <BuyerDossierControls options={buyerDossierOptions} readOnly={operatorPreview} compact />
                          <Link href={operatorPreview
                            ? `/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview/loi${representativePreviewQuery}`
                            : "/representative/loi"}
                            prefetch={false} className={cupStyles.intakeLink}>
                            Preview LOI <span aria-hidden="true">↗</span>
                          </Link>
                        </div>
                      }
                    >
                      {commercialUtilityPack.modules.flatMap(entry =>
                        entry.resources.map(resource => ({ module: entry.module, resource }))
                      ).map(({ module, resource }, index) => (
                        <article key={resource.id} className={cupStyles.resource}>
                          <div className={cupStyles.hanger} aria-hidden="true" />

                          <h3 className={cupStyles.resourceTitle}>
                            {resource.label || humanize(resource.resourceType)}
                          </h3>
                          <div className={cupStyles.materialActionRow}>
                          {operatorPreview ? (
                            <Link
                              href={`/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview/resources/${encodeURIComponent(resource.id)}${representativePreviewQuery}`}
                              prefetch={false}
                              className={cupStyles.openResource}
                            >
                              Open separately <span aria-hidden="true">↗</span>
                            </Link>
                          ) : ((resource.resourceType === "STRUCTURED_CONTENT" &&
                              (module === "REPRESENTATION" || module === "OPERATING_BOUNDARIES")) ||
                            (["INSTITUTIONAL_INSTRUMENT", "DOCUMENT"].includes(resource.resourceType) && module === "DOCUMENTS")) ? (
                            <Link
                              href={resource.resourceType === "INSTITUTIONAL_INSTRUMENT"
                                ? `/representative/resources/${encodeURIComponent(resource.id)}/institutional`
                                : `/representative/resources/${encodeURIComponent(resource.id)}`}
                              prefetch={false}
                              className={cupStyles.openResource}
                            >
                              Open separately <span aria-hidden="true">↗</span>
                            </Link>
                          ) : (
                            <p className={cupStyles.resourceAccess}>Viewer not yet available.</p>
                          )}

                          <Link
                            href={`${
                              operatorPreview
                                ? `/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview`
                                : "/representative"
                            }?view=communications&fieldContextType=CUP_RESOURCE&fieldContextId=${encodeURIComponent(resource.id)}${representativePreviewContinuation}`}
                            className={cupStyles.openResource}
                          >
                            Ask French-Ward <span aria-hidden="true">→</span>
                          </Link>

                          </div>
                          <CupMaterialUse id={resource.id}
                            canPresent={resource.canPresent}
                            canTransmit={resource.canTransmit}
                            canDownload={resource.canDownload} />

                          <CupMaterialReader
                            resourceReleaseId={resource.id}
                            resourceType={resource.resourceType}
                            agreementPdf={resource.resourceType === "INSTITUTIONAL_INSTRUMENT" && agreementIds.has(resource.resourceId)}
                            resourceReference={resource.resourceType === "DOCUMENT" ? resource.resourceId : undefined}
                            title={resource.label || humanize(resource.resourceType)}
                            previewParticipantId={operatorPreview ? previewParticipantId : undefined}
                          />
                        </article>
                      ))}
                    </CupWorkingSet>
                  </>
                ) : (
                  <p className={cupStyles.pending}>
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
              {operatorPreview ? <Link className={canvas.openResource} href={`/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview/appointment${representativePreviewQuery}`}>Inspect Appointment Instrument ↗</Link> : <Link className={canvas.openResource} href={`/representative/appointments/${appointment.id}`}>
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
                  Appointment Active
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
                    {operatorPreview ? <Link className={canvas.plaqueLink} href={`/admin/representative-program/participants/${encodeURIComponent(previewParticipantId!)}/workspace-preview/appointment${representativePreviewQuery}`}>Inspect Record →</Link> : <Link href={`/representative/appointments/${appointment.id}`} className={canvas.plaqueLink}>
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
