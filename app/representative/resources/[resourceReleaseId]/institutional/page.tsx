import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  prisma,
} from "@/infrastructure/db/prisma";

import {
  loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient,
} from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

function humanize(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase(),
    );
}

export default async function RepresentativeInstitutionalResourcePage({
  params,
}: {
  params:
    Promise<{
      resourceReleaseId: string;
    }>;
}) {
  const principal =
    await getPrincipal();

  const {
    resourceReleaseId,
  } =
    await params;

  if (!principal) {
    const next =
      `/representative/resources/` +
      `${encodeURIComponent(resourceReleaseId)}/institutional`;

    redirect(
      `/login?next=${encodeURIComponent(next)}`,
    );
  }

  const consumption =
    await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
      client: prisma,
      userId: principal.userId,
      resourceReleaseId,
      action: "VIEW",
    });

  if (!consumption.allowed) notFound();

  const resource =
    await loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient({
      client: prisma,
      userId:
        principal.userId,
      resourceReleaseId,
    });

  if (!resource) {
    notFound();
  }

  /*
   * Preserve the existing executed-agreement delivery path.
   *
   * This dispatcher only determines which governed institutional
   * presentation applies. It does not replace the agreement loader.
   */
  if (
    resource.kind ===
    "REPRESENTATIVE_PROGRAM_AGREEMENT"
  ) {
    redirect(
      `/api/representative/commercial-utility-packs/resources/` +
      `${encodeURIComponent(resource.resourceReleaseId)}/document`,
    );
  }

  const {
    presentation,
  } =
    resource;

  const {
    identity,
    standing,
    assertions,
    evidenceRegister,
    capabilities,
    boundary,
  } =
    presentation;

  return (
    <main className="min-h-screen bg-[#120f0c] px-6 py-10 text-[#eee7da]">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/representative"
          className="text-sm text-[#d8c39b] underline underline-offset-4"
        >
          Back to Representative Workspace
        </Link>

        <article className="mt-7 border border-[#40362d] bg-[#17120e] p-6 md:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b99657]">
            French-Ward · Representative Field Resource
          </p>

          <p className="mt-3 break-words font-mono text-xs text-[#8d8377]">
            {resource.packageReference}
          </p>

          <h1 className="mt-5 text-3xl font-medium tracking-[-0.03em]">
            {identity.instrumentTitle}
          </h1>

          <p className="mt-3 font-mono text-xs text-[#8d8377]">
            {identity.instrumentReference}
            {" · "}
            Version {identity.versionNumber}
          </p>

          <div className="mt-7 grid gap-4 border-y border-[#392f27] py-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8d8377]">
                Subject
              </p>
              <p className="mt-2 text-sm">
                {identity.subject.displayName}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8d8377]">
                Jurisdiction
              </p>
              <p className="mt-2 text-sm">
                {identity.subject.jurisdiction}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8d8377]">
                Presentation Standing
              </p>
              <p className="mt-2 text-sm text-[#d8c39b]">
                {humanize(standing)}
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-medium text-[#d8c39b]">
              Institutional Particulars
            </h2>

            <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#8d8377]">
                  Profile reference
                </dt>
                <dd className="mt-1">
                  {identity.profileParticulars.documentReference}
                </dd>
              </div>

              <div>
                <dt className="text-[#8d8377]">
                  Profile status
                </dt>
                <dd className="mt-1">
                  {identity.profileParticulars.documentStatus}
                </dd>
              </div>

              <div>
                <dt className="text-[#8d8377]">
                  Registration standing
                </dt>
                <dd className="mt-1">
                  {humanize(
                    identity.profileParticulars.registrationStanding,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-[#8d8377]">
                  Institutional capacity
                </dt>
                <dd className="mt-1">
                  {identity.subject.institutionalCapacity}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mt-8 border-t border-[#392f27] pt-6">
            <h2 className="text-lg font-medium text-[#d8c39b]">
              Source Assertions
            </h2>

            {assertions.length ? (
              <div className="mt-5 space-y-5">
                {assertions.map(assertion => (
                  <section
                    key={assertion.reference}
                    className="border border-[#392f27] bg-[#120f0c] p-5"
                  >
                    <p className="font-mono text-xs text-[#8d8377]">
                      {assertion.reference}
                      {" · "}
                      {humanize(assertion.assertionClass)}
                    </p>

                    <h3 className="mt-3 text-base font-medium">
                      {assertion.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#b9b0a3]">
                      {assertion.statement}
                    </p>

                    {assertion.scope ? (
                      <p className="mt-3 text-xs leading-6 text-[#8d8377]">
                        Scope: {assertion.scope}
                      </p>
                    ) : null}

                    <p className="mt-4 text-xs text-[#d8c39b]">
                      Assertion recognition:{" "}
                      {assertion.recognition
                        ? humanize(assertion.recognition.outcome)
                        : "No current recognition recorded"}
                    </p>
                    {assertion.recognition?.limitation ? (
                      <p className="mt-3 text-sm leading-7 text-[#d8c39b]">
                        Recorded limitation: {assertion.recognition.limitation}
                      </p>
                    ) : null}
                  </section>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[#8d8377]">
                No assertions are available in this representative projection.
              </p>
            )}
          </section>

          <section className="mt-8 border-t border-[#392f27] pt-6">
            <h2 className="text-lg font-medium text-[#d8c39b]">
              Evidence Register
            </h2>

            {evidenceRegister.length ? (
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#b9b0a3]">
                {evidenceRegister.map(evidence => (
                  <li key={evidence.evidenceId}>
                    {evidence.label}
                    {evidence.reference
                      ? ` · ${evidence.reference}`
                      : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[#8d8377]">
                No evidence is available in this representative projection.
              </p>
            )}
          </section>

          <section className="mt-8 border-t border-[#392f27] pt-6">
            <h2 className="text-lg font-medium text-[#d8c39b]">
              Source Capabilities
            </h2>

            {capabilities.length ? (
              <ul className="mt-4 space-y-4">
                {capabilities.map(capability => (
                  <li
                    key={`${capability.assertionReference}:${capability.capabilityKey}`}
                    className="text-sm leading-7 text-[#b9b0a3]"
                  >
                    <span className="text-[#eee7da]">
                      {capability.title}
                    </span>
                    {" — "}
                    {capability.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[#8d8377]">
                No capabilities are available in this representative projection.
              </p>
            )}
          </section>

          <section className="mt-8 border-t border-[#392f27] pt-6">
            <h2 className="text-lg font-medium text-[#d8c39b]">
              Authority Boundary
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#b9b0a3]">
              {boundary.statement}
            </p>

            <p className="mt-4 text-sm leading-7 text-[#d8c39b]">
              This record concerns source-side institutional assertions.
              It does not delegate source authority to you. Your authority
              to present or transmit this material requires a separate
              Authorized Representation Program decision for the intended use.
            </p>

            <p className="mt-4 text-xs leading-6 text-[#8d8377]">
              This presentation does not establish sovereign authority,
              regulatory approval, export authorization, commodity
              availability or allocation, title, transaction authority,
              or settlement authority.
            </p>
          </section>

          <p className="mt-10 border-t border-[#392f27] pt-6 text-xs leading-6 text-[#8f8578]">
            Resource access does not establish appointment or transaction
            authority. Presentation and transmission permissions remain
            separately governed by the Authorized Representation Program.
          </p>
        </article>
      </div>
    </main>
  );
}
