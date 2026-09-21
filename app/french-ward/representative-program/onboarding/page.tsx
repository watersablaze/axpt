import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { REPRESENTATIVE_ONBOARDING_ACCESS_COOKIE } from "@/domains/instruments/representative-program/onboarding/accessCookie";
import { loadRepresentativeOnboardingCandidate } from "@/domains/instruments/representative-program/onboarding/application/loadRepresentativeOnboardingCandidate";

import RepresentativeOnboardingForm from "./RepresentativeOnboardingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authorized Representation Program | French-Ward",
  description:
    "Private candidate intake for the French-Ward Authorized Representation Program.",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default async function RepresentativeOnboardingPage() {
  const rawAccessToken = (await cookies()).get(
    REPRESENTATIVE_ONBOARDING_ACCESS_COOKIE,
  )?.value;

  if (!rawAccessToken) {
    notFound();
  }

  const candidate = await loadRepresentativeOnboardingCandidate({
    rawAccessToken,
  });

  if (!candidate) {
    notFound();
  }

  return (
    <main
      className="min-h-screen py-0 text-[#181714] md:py-14"
      style={{
        background: "#E8E2D6",
      }}
    >
      <article
        className="mx-auto max-w-5xl border-y border-black/20 shadow-none md:border md:shadow-2xl"
        style={{
          background: "#F4EFE3",
        }}
      >
        <header className="border-b border-black/25 px-5 py-6 md:px-12 md:py-7">
          <div className="block md:flex md:flex-wrap md:items-start md:justify-between md:gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                French-Ward, Inc.
              </p>

              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/45">
                Authorized Representation Program
              </p>
            </div>

            <div className="mt-5 border-t border-black/20 pt-4 text-left text-[11px] leading-5 text-black/50 md:mt-0 md:border-0 md:pt-0 md:text-right md:text-xs">
              <p>Private Candidate Intake</p>
              <p>{candidate.reference}</p>
            </div>
          </div>
        </header>

        <section className="px-5 py-10 md:px-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.22em] text-black/45">
            Representative Intake &amp; Qualification
          </p>

          <h1 className="mt-4 max-w-3xl font-serif text-[2rem] leading-[1.05] md:text-5xl md:leading-tight">
            Entry precedes authority.
          </h1>

          <p className="mt-5 max-w-3xl text-[13px] leading-6 text-black/65 md:mt-6 md:text-sm md:leading-7">
            This private instrument records information supplied for French-Ward
            review. Candidate submission does not create Program admission,
            appointment, mandate, or authority.
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-px border border-black/20 bg-black/20 md:mt-9 md:grid-cols-3">
            <div className="flex items-start justify-between gap-4 bg-[#F4EFE3] p-4 md:block">
              <dt className="text-[11px] uppercase tracking-[0.16em] text-black/45 md:text-[10px] md:tracking-[0.18em]">
                Candidate
              </dt>
              <dd className="mt-0 max-w-[62%] text-right text-sm font-medium md:mt-2 md:max-w-none md:text-left">
                {candidate.candidateDisplayName}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4 bg-[#F4EFE3] p-4 md:block">
              <dt className="text-[11px] uppercase tracking-[0.16em] text-black/45 md:text-[10px] md:tracking-[0.18em]">
                Intake State
              </dt>
              <dd className="mt-0 max-w-[62%] text-right text-sm font-medium md:mt-2 md:max-w-none md:text-left">
                {candidate.status.replaceAll("_", " ")}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4 bg-[#F4EFE3] p-4 md:block">
              <dt className="text-[11px] uppercase tracking-[0.16em] text-black/45 md:text-[10px] md:tracking-[0.18em]">
                Reference
              </dt>
              <dd className="mt-0 max-w-[62%] break-all text-right font-mono text-[11px] leading-5 md:mt-2 md:max-w-none md:text-left md:text-xs">
                {candidate.reference}
              </dd>
            </div>
          </dl>
        </section>

        <RepresentativeOnboardingForm
          candidate={{
            reference: candidate.reference,
            status: candidate.status,
            candidateDisplayName: candidate.candidateDisplayName,
            candidateEmail: candidate.candidateEmail,
            accessExpiresAt: candidate.accessExpiresAt?.toISOString() ?? null,
            submission: candidate.submission,
          }}
        />

        <footer className="border-t border-black/25 px-5 py-6 text-[10px] uppercase tracking-[0.14em] text-black/40 md:px-12 md:tracking-[0.15em]">
          <div className="grid gap-2 md:flex md:flex-wrap md:justify-between md:gap-3">
            <span>Controlled Candidate Instrument</span>
            <span>Candidate ≠ Participant</span>
            <span>Submission ≠ Authority</span>
          </div>
        </footer>
      </article>
    </main>
  );
}
