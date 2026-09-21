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
      className="min-h-screen py-8 text-[#181714] md:py-14"
      style={{
        background: "#E8E2D6",
      }}
    >
      <article
        className="mx-auto max-w-5xl border border-black/20 shadow-2xl"
        style={{
          background: "#F4EFE3",
        }}
      >
        <header className="border-b border-black/25 px-6 py-7 md:px-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                French-Ward, Inc.
              </p>

              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/45">
                Authorized Representation Program
              </p>
            </div>

            <div className="text-right text-xs leading-5 text-black/50">
              <p>Private Candidate Intake</p>
              <p>{candidate.reference}</p>
            </div>
          </div>
        </header>

        <section className="px-6 py-12 md:px-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.22em] text-black/45">
            Representative Intake &amp; Qualification
          </p>

          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-5xl">
            Entry precedes authority.
          </h1>

          <p className="mt-6 max-w-3xl text-sm leading-7 text-black/65">
            This private instrument records information supplied for French-Ward
            review. Candidate submission does not create Program admission,
            appointment, mandate, or authority.
          </p>

          <dl className="mt-9 grid gap-px border border-black/20 bg-black/20 sm:grid-cols-3">
            <div className="bg-[#F4EFE3] p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-black/45">
                Candidate
              </dt>
              <dd className="mt-2 text-sm font-medium">
                {candidate.candidateDisplayName}
              </dd>
            </div>

            <div className="bg-[#F4EFE3] p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-black/45">
                Intake State
              </dt>
              <dd className="mt-2 text-sm font-medium">
                {candidate.status.replaceAll("_", " ")}
              </dd>
            </div>

            <div className="bg-[#F4EFE3] p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-black/45">
                Reference
              </dt>
              <dd className="mt-2 break-all font-mono text-xs">
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

        <footer className="border-t border-black/25 px-6 py-6 text-[10px] uppercase tracking-[0.15em] text-black/40 md:px-12">
          <div className="flex flex-wrap justify-between gap-3">
            <span>Controlled Candidate Instrument</span>
            <span>Candidate ≠ Participant</span>
            <span>Submission ≠ Authority</span>
          </div>
        </footer>
      </article>
    </main>
  );
}
