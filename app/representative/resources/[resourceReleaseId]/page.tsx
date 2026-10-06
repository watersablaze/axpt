import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeCommercialUtilityPackResourceWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackResourceWithClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function ContentList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <section className="mt-8 border-t border-[#392f27] pt-6">
      <h2 className="text-lg font-medium text-[#d8c39b]">{title}</h2>
      <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-[#b9b0a3]">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </section>
  );
}

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

  const resource =
    await loadRepresentativeCommercialUtilityPackResourceWithClient({
      client: prisma,
      userId: principal.userId,
      resourceReleaseId,
    });

  if (!resource) notFound();

  return (
    <main className="min-h-screen bg-[#120f0c] px-6 py-10 text-[#eee7da]">
      <div className="mx-auto max-w-4xl">
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

          {resource.kind === "INSTITUTIONAL_PROFILE" ? (
            <>
              <h1 className="mt-5 text-3xl font-medium tracking-[-0.03em]">
                {resource.content.displayName} Institutional Profile
              </h1>
              <p className="mt-3 text-sm text-[#d8c39b]">
                {resource.content.legalName} · {resource.content.classification}
              </p>
              <p className="mt-3 font-mono text-xs text-[#8d8377]">
                {resource.content.reference} · Version {resource.content.version}
              </p>
              <p className="mt-7 text-sm leading-7 text-[#b9b0a3]">
                {resource.content.publicDescription}
              </p>
              <p className="mt-4 text-sm leading-7 text-[#b9b0a3]">
                {resource.content.orientation}
              </p>
              <ContentList title="Institutional Definition" items={resource.content.institutionalDefinition} />
              <ContentList title="Domains" items={resource.content.domains} />
              <ContentList title="Practice Areas" items={resource.content.practiceAreas} />
              <ContentList title="Operating Principles" items={resource.content.operatingPrinciples} />
              <ContentList title="Operating Continuum" items={resource.content.operatingContinuum} />
            </>
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
