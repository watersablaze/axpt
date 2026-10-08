import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
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

function ProfileDefinition({ items }: { items: readonly string[] }) {
  return (
    <section className="mt-8 border-t border-[#392f27] pt-6">
      <h2 className="text-lg font-medium text-[#d8c39b]">Institutional Identity</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[#c9c0b3]">
        {items.map((item, index) => <p key={index}>{item}</p>)}
      </div>
    </section>
  );
}

function ProfileDomains({ items }: { items: readonly string[] }) {
  return (
    <section className="mt-8 border-t border-[#392f27] pt-6">
      <h2 className="text-lg font-medium text-[#d8c39b]">Fields of Activity</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li key={index} className="border border-[#40362d] bg-[#211a13] px-3 py-2 text-sm text-[#d8c39b]">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileContinuum({ items }: { items: readonly string[] }) {
  return (
    <section className="mt-8 border-t border-[#392f27] pt-6">
      <h2 className="text-lg font-medium text-[#d8c39b]">Operating Sequence</h2>
      <p className="mt-3 text-sm leading-6 text-[#b9b0a3]">
        A working sequence shaped by the requirements of each transaction.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-3 border-l border-[#6b5535] py-2 pl-3">
            <span aria-hidden="true" className="font-mono text-xs text-[#b99657]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm text-[#eee7da]">{item}</span>
          </li>
        ))}
      </ol>
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
              {profileDownload?.allowed && (
                <a
                  href={`/api/representative/commercial-utility-packs/resources/${encodeURIComponent(resourceReleaseId)}/profile`}
                  className="mt-5 inline-block border border-[#6b5535] px-4 py-2 text-sm text-[#d8c39b]"
                >
                  Download Profile · HTML
                </a>
              )}
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
              <ProfileDefinition items={resource.content.institutionalDefinition} />
              <ProfileDomains items={resource.content.domains} />
              <ContentList title="Practice Areas" items={resource.content.practiceAreas} />
              <ContentList title="Operating Principles" items={resource.content.operatingPrinciples} />
              <ProfileContinuum items={resource.content.operatingContinuum} />
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
