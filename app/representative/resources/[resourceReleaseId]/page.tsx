import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
import { FrenchWardInstitutionalProfileView } from "@/components/french-ward/profile/FrenchWardInstitutionalProfileView";
import Link from "next/link";
import ProfileUseControls from "../../ProfileUseControls";
import boundaries from "./operating-boundaries.module.css";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeCommercialUtilityPackResourceWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackResourceWithClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RepresentativeResourcePage({
  params,
}: {
  params: Promise<{ resourceReleaseId: string }>;
}) {
  const principal = await getPrincipal();
  const { resourceReleaseId } = await params;

  if (!principal) {
    const next = `/representative/resources/${encodeURIComponent(resourceReleaseId)}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
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
    await loadRepresentativeCommercialUtilityPackResourceWithClient({
      client: prisma,
      userId: principal.userId,
      resourceReleaseId,
    });

  if (!resource) notFound();

  const profileDownload = resource.kind === "INSTITUTIONAL_PROFILE"
    ? await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
        client: prisma,
        userId: principal.userId,
        resourceReleaseId,
        action: "DOWNLOAD",
      })
    : null;

  return (
    <main
      className={
        resource.kind === "INSTITUTIONAL_PROFILE"
          ? "min-h-screen bg-[#0c1d25] px-4 py-8 text-[#eee7da] md:px-8"
          : boundaries.page
      }
    >
      <div
        className={
          resource.kind === "INSTITUTIONAL_PROFILE"
            ? "mx-auto max-w-7xl"
            : boundaries.frame
        }
      >
        <Link
          href="/representative"
          className="text-sm text-[#d8c39b] underline underline-offset-4"
        >
          Back to Representative Workspace
        </Link>

        <article
          className={
            resource.kind === "INSTITUTIONAL_PROFILE"
              ? "mt-7"
              : boundaries.record
          }
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b99657]">
            French-Ward · Representative Field Resource
          </p>
          <p className="mt-3 break-words font-mono text-xs text-[#8d8377]">
            {resource.packageReference}
          </p>

          {resource.kind === "INSTITUTIONAL_PROFILE" ? (
            <>
            <FrenchWardInstitutionalProfileView
              profile={resource.content}
              packageReference={resource.packageReference}
              downloadHref={
                profileDownload?.allowed
                  ? `/api/representative/commercial-utility-packs/resources/${encodeURIComponent(resourceReleaseId)}/profile`
                  : undefined
              }
            />
              <ProfileUseControls resourceReleaseId={resourceReleaseId} />
            </>
          ) : (
            <>
              <h1 className={boundaries.title}>
                {resource.content.title}
              </h1>
              <p className={boundaries.reference}>
                {resource.content.reference} · Version {resource.content.version}
              </p>
              <p className={boundaries.scope}>
                {resource.content.scope}
              </p>
              <p className={boundaries.authority}>
                {resource.content.authorityStatement}
              </p>
              {resource.content.boundaries.map(boundary => (
                <section key={boundary.key} className={boundaries.section}>
                  <h2 className={boundaries.sectionTitle}>
                    {boundary.title}
                  </h2>
                  <p className={boundaries.statement}>
                    {boundary.statement}
                  </p>
                  <p className={boundaries.instruction}>
                    {boundary.representativeInstruction}
                  </p>
                </section>
              ))}
            </>
          )}

          <p className="mt-10 border-t border-[#392f27] pt-6 text-xs leading-6 text-[#8f8578]">
            Resource access does not establish appointment or transaction authority.
            Download, presentation, and transmission permissions remain separately governed.
          </p>
        </article>
      </div>
    </main>
  );
}
