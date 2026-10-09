import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
import { FrenchWardInstitutionalProfileView } from "@/components/french-ward/profile/FrenchWardInstitutionalProfileView";
import Link from "next/link";
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
          : "min-h-screen bg-[#120f0c] px-6 py-10 text-[#eee7da]"
      }
    >
      <div
        className={
          resource.kind === "INSTITUTIONAL_PROFILE"
            ? "mx-auto max-w-7xl"
            : "mx-auto max-w-4xl"
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
              : "mt-7 border border-[#40362d] bg-[#17120e] p-6 md:p-10"
          }
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b99657]">
            French-Ward · Representative Field Resource
          </p>
          <p className="mt-3 break-words font-mono text-xs text-[#8d8377]">
            {resource.packageReference}
          </p>

          {resource.kind === "INSTITUTIONAL_PROFILE" ? (
            <FrenchWardInstitutionalProfileView
              profile={resource.content}
              packageReference={resource.packageReference}
              downloadHref={
                profileDownload?.allowed
                  ? `/api/representative/commercial-utility-packs/resources/${encodeURIComponent(resourceReleaseId)}/profile`
                  : undefined
              }
            />
          ) : (
            <>
              <h1 className="mt-5 text-3xl font-medium tracking-[-0.03em]">
                {resource.content.title}
              </h1>
              <p className="mt-3 font-mono text-xs text-[#8d8377]">
                {resource.content.reference} · Version {resource.content.version}
              </p>
              <p className="mt-7 text-sm leading-7 text-[#b9b0a3]">
                {resource.content.scope}
              </p>
              <p className="mt-4 text-sm leading-7 text-[#d8c39b]">
                {resource.content.authorityStatement}
              </p>
              {resource.content.boundaries.map(boundary => (
                <section key={boundary.key} className="mt-8 border-t border-[#392f27] pt-6">
                  <h2 className="text-lg font-medium text-[#d8c39b]">
                    {boundary.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#b9b0a3]">
                    {boundary.statement}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[#eee7da]">
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
