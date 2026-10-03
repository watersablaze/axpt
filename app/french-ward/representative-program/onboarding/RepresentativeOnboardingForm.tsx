"use client";

import { REPRESENTATIVE_ONBOARDING_SUBMIT_PATH } from "@/domains/instruments/representative-program/onboarding/accessCookie";

import { type FormEvent, useState } from "react";

import type { RepresentativeCandidateSubmissionInput } from "@/domains/instruments/representative-program/onboarding/http/candidateSubmissionSchema";

type Candidate = Readonly<{
  reference: string;
  status: string;
  candidateDisplayName: string;
  candidateEmail: string;
  accessExpiresAt: string | null;
  submission: RepresentativeCandidateSubmissionInput | null;
}>;

type Props = {
  candidate: Candidate;
};

const acknowledgementFields = [
  {
    key: "noImpliedAuthority",
    title: "No implied authority",
    body: "I understand that candidate status, submission, relationship, title, discussion, or access to French-Ward materials does not itself grant authority to represent or bind French-Ward.",
  },
  {
    key: "noUnauthorizedCommercialTermChanges",
    title: "Commercial terms remain controlled",
    body: "I will not invent, alter, extend, negotiate, or communicate commercial terms beyond those expressly authorized by French-Ward.",
  },
  {
    key: "noImpersonationOfFrenchWard",
    title: "No impersonation",
    body: "I will not present myself as French-Ward, Inc. or imply that I hold an institutional capacity that has not been expressly appointed.",
  },
  {
    key: "noUnauthorizedSubdelegation",
    title: "No unauthorized subdelegation",
    body: "I understand that I may not transfer, delegate, or confer any French-Ward authority to another person unless expressly authorized in writing.",
  },
  {
    key: "confidentialityAcknowledged",
    title: "Confidentiality",
    body: "I acknowledge that non-public French-Ward information and transaction materials must be handled only for authorized purposes.",
  },
  {
    key: "writtenAppointmentControlsAuthority",
    title: "Written appointment controls",
    body: "I understand that any actual representative authority is determined only by the written appointment and authority instruments issued by French-Ward.",
  },
  {
    key: "informationAccurateToBestKnowledge",
    title: "Accuracy of information",
    body: "I confirm that the information submitted is accurate and materially complete to the best of my knowledge, and that I have not knowingly omitted information material to French-Ward’s review.",
  },
] as const;

function optional(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function list(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function initialList(value: readonly string[] | undefined) {
  return value?.join("\n") ?? "";
}

export default function RepresentativeOnboardingForm({ candidate }: Props) {
  const existing = candidate.submission;

  const editable =
    candidate.status === "DRAFT" ||
    candidate.status === "RETURNED_FOR_COMPLETION";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(candidate.status === "SUBMITTED");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const acknowledgements = Object.fromEntries(
      acknowledgementFields.map(({ key }) => [key, form.get(key) === "on"]),
    );

    const payload = {
      identity: {
        fullLegalName: String(form.get("fullLegalName") ?? "").trim(),
        preferredProfessionalName: optional(
          form.get("preferredProfessionalName"),
        ),
        nationality: optional(form.get("nationality")),
        countryOfResidence: optional(form.get("countryOfResidence")),
        primaryAddress: optional(form.get("primaryAddress")),
        email: String(form.get("email") ?? "").trim(),
        telephone: optional(form.get("telephone")),
        whatsapp: optional(form.get("whatsapp")),
        passportOrIdReference: optional(form.get("passportOrIdReference")),
      },

      professionalProfile: {
        currentOccupationOrRole: optional(form.get("currentOccupationOrRole")),
        companyOrOrganizationAffiliations: list(
          form.get("companyOrOrganizationAffiliations"),
        ),
        relevantMarketsOrIndustries: list(
          form.get("relevantMarketsOrIndustries"),
        ),
        primaryTerritories: list(form.get("primaryTerritories")),
        languages: list(form.get("languages")),
        commercialCapabilities: list(form.get("commercialCapabilities")),
      },

      representationContext: {
        introductionContext: optional(form.get("introductionContext")),
        expectedContribution: optional(form.get("expectedContribution")),
        relevantRelationshipsOrNetworks: optional(
          form.get("relevantRelationshipsOrNetworks"),
        ),
        anticipatedRepresentationAreas: list(
          form.get("anticipatedRepresentationAreas"),
        ),
      },

      disclosures: {
        existingMandatesOrRepresentativeRelationships: optional(
          form.get("existingMandatesOrRepresentativeRelationships"),
        ),
        potentialConflicts: optional(form.get("potentialConflicts")),
        regulatedActivities: optional(form.get("regulatedActivities")),
        materialAffiliations: optional(form.get("materialAffiliations")),
      },

      acknowledgements,
    };

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(REPRESENTATIVE_ONBOARDING_SUBMIT_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Unable to submit intake.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to reach the onboarding service.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!editable || submitted) {
    return (
      <section className="border-t border-black/20 px-5 py-10 md:px-12 md:py-12">
        <p className="text-xs uppercase tracking-[0.24em] text-black/50">
          Current State
        </p>

        <h2 className="mt-3 font-serif text-[1.75rem] leading-tight text-[#181714] md:text-3xl">
          {submitted
            ? "Submission received."
            : candidate.status.replaceAll("_", " ")}
        </h2>

        <p className="mt-4 max-w-2xl text-[13px] leading-6 text-black/65 md:text-sm md:leading-7">
          Your candidate record remains under French-Ward governance. Submission
          does not constitute qualification, Program admission, appointment,
          mandate, or delegated authority.
        </p>
      </section>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="border-t border-black/20 lg:grid lg:grid-cols-[210px_minmax(0,1fr)]"
    >
      <aside className="hidden border-r border-black/20 bg-[#EAE4D8] lg:block">
        <nav className="sticky top-32 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/35">
            Intake Sections
          </p>

          <div className="mt-4 grid gap-1">
            {[
              ["01", "Candidate Identity", "candidate-identity"],
              ["02", "Professional Profile", "professional-profile"],
              ["03", "Representation Context", "representation-context"],
              ["04", "Disclosures", "disclosures"],
              ["05", "Candidate Assertions", "candidate-assertions"],
            ].map(([index, label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                className="group flex items-start gap-3 border-l border-black/15 px-3 py-2.5 transition hover:border-black hover:bg-black/[0.04]"
              >
                <span className="font-mono text-[10px] leading-5 text-black/30 group-hover:text-black/55">
                  {index}
                </span>

                <span className="text-[11px] font-medium leading-5 text-black/55 group-hover:text-black/85">
                  {label}
                </span>
              </a>
            ))}
          </div>

          <div className="mt-6 border-t border-black/15 pt-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-black/30">
              Controlled Instrument
            </p>
            <p className="mt-2 text-[11px] leading-5 text-black/45">
              Candidate ≠ Participant
              <br />
              Submission ≠ Authority
            </p>
          </div>
        </nav>
      </aside>

      <div className="min-w-0">
        <Section
          id="candidate-identity"
          index="01"
          eyebrow="Candidate Identity"
          title="Identify the person entering review."
        >
          <Grid>
            <Field
              label="Full Legal Name"
              name="fullLegalName"
              required
              defaultValue={
                existing?.identity.fullLegalName ??
                candidate.candidateDisplayName
              }
            />

            <Field
              label="Preferred Professional Name"
              name="preferredProfessionalName"
              defaultValue={existing?.identity.preferredProfessionalName}
            />

            <Field
              label="Email"
              name="email"
              type="email"
              required
              defaultValue={
                existing?.identity.email ?? candidate.candidateEmail
              }
            />

            <Field
              label="Nationality"
              name="nationality"
              defaultValue={existing?.identity.nationality}
            />

            <Field
              label="Country of Residence"
              name="countryOfResidence"
              defaultValue={existing?.identity.countryOfResidence}
            />

            <Field
              label="Telephone"
              name="telephone"
              defaultValue={existing?.identity.telephone}
            />

            <Field
              label="WhatsApp"
              name="whatsapp"
              defaultValue={existing?.identity.whatsapp}
            />

            <Field
              label="Passport / ID Reference"
              name="passportOrIdReference"
              defaultValue={existing?.identity.passportOrIdReference}
            />
          </Grid>

          <TextArea
            label="Primary Address"
            name="primaryAddress"
            defaultValue={existing?.identity.primaryAddress}
          />
        </Section>

        <Section
          id="professional-profile"
          index="02"
          eyebrow="Professional Profile"
          title="Describe your present commercial field."
        >
          <Field
            label="Current Occupation / Role"
            name="currentOccupationOrRole"
            defaultValue={existing?.professionalProfile.currentOccupationOrRole}
          />

          <Grid>
            <TextArea
              label="Companies / Organizations"
              density="compact"
              name="companyOrOrganizationAffiliations"
              hint="One per line or comma-separated."
              defaultValue={initialList(
                existing?.professionalProfile.companyOrOrganizationAffiliations,
              )}
            />

            <TextArea
              label="Relevant Markets / Industries"
              density="compact"
              name="relevantMarketsOrIndustries"
              hint="One per line or comma-separated."
              defaultValue={initialList(
                existing?.professionalProfile.relevantMarketsOrIndustries,
              )}
            />

            <TextArea
              label="Primary Territories"
              density="compact"
              name="primaryTerritories"
              hint="Countries, regions, or corridors."
              defaultValue={initialList(
                existing?.professionalProfile.primaryTerritories,
              )}
            />

            <TextArea
              label="Languages"
              density="compact"
              name="languages"
              hint="One per line or comma-separated."
              defaultValue={initialList(
                existing?.professionalProfile.languages,
              )}
            />
          </Grid>

          <TextArea
            label="Commercial Capabilities"
            name="commercialCapabilities"
            hint="Introductions, coordination, sector knowledge, documentary work, logistics, or other relevant capabilities."
            defaultValue={initialList(
              existing?.professionalProfile.commercialCapabilities,
            )}
          />
        </Section>

        <Section
          id="representation-context"
          index="03"
          eyebrow="Representation Context"
          title="Place the proposed relationship in context."
        >
          <TextArea
            label="Introduction Context"
            name="introductionContext"
            defaultValue={existing?.representationContext.introductionContext}
          />

          <TextArea
            label="Expected Contribution"
            name="expectedContribution"
            defaultValue={existing?.representationContext.expectedContribution}
          />

          <TextArea
            label="Relevant Relationships / Networks"
            name="relevantRelationshipsOrNetworks"
            defaultValue={
              existing?.representationContext.relevantRelationshipsOrNetworks
            }
          />

          <TextArea
            label="Anticipated Representation Areas"
            name="anticipatedRepresentationAreas"
            hint="One per line or comma-separated. This does not itself create authority."
            defaultValue={initialList(
              existing?.representationContext.anticipatedRepresentationAreas,
            )}
          />
        </Section>

        <Section
          id="disclosures"
          index="04"
          eyebrow="Disclosures"
          title="Surface conditions that French-Ward should know."
        >
          <p className="max-w-3xl text-[12px] leading-5 text-black/50 md:text-xs md:leading-6">
            Disclose any applicable condition below. If none applies, state
            “None.”
          </p>

          <TextArea
            label="Existing Mandates / Representative Relationships"
            name="existingMandatesOrRepresentativeRelationships"
            required
            defaultValue={
              existing?.disclosures
                .existingMandatesOrRepresentativeRelationships
            }
          />

          <TextArea
            label="Potential Conflicts"
            name="potentialConflicts"
            required
            defaultValue={existing?.disclosures.potentialConflicts}
          />

          <TextArea
            label="Regulated / Licensed Activities"
            name="regulatedActivities"
            required
            defaultValue={existing?.disclosures.regulatedActivities}
          />

          <TextArea
            label="Material Affiliations"
            name="materialAffiliations"
            hint="Organizations, commercial interests, fiduciary roles, or other affiliations potentially relevant to representation."
            required
            defaultValue={existing?.disclosures.materialAffiliations}
          />
        </Section>

        <Section
          id="candidate-assertions"
          index="05"
          eyebrow="Candidate Assertions"
          title="Confirm the conditions of candidacy."
        >
          <div className="grid gap-3">
            {acknowledgementFields.map(({ key, title, body }) => (
              <label
                key={key}
                className="flex gap-3 border border-black/25 bg-black/[0.025] p-3 transition focus-within:border-black/50 md:gap-4"
              >
                <input
                  type="checkbox"
                  name={key}
                  required
                  defaultChecked={existing?.acknowledgements[key] ?? false}
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-black md:mt-1 md:h-4 md:w-4"
                />

                <span>
                  <strong className="block text-[13px] font-semibold leading-5 text-[#181714] md:text-sm md:leading-normal">
                    {title}
                  </strong>

                  <span className="mt-1.5 block text-[12px] leading-5 text-black/65 md:mt-1 md:text-xs md:leading-6">
                    {body}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Section>

        <section className="border-t border-black/30 px-5 py-5 md:border-black/20 md:px-8 md:py-6">
          <p className="max-w-3xl text-[12px] leading-5 text-black/55 md:text-xs md:leading-6">
            Submission places this candidate intake into French-Ward review. It
            does not itself constitute qualification, admission, appointment,
            mandate, authority, transaction attachment, or compensation
            entitlement.
          </p>

          {error ? (
            <p className="mt-5 border border-red-900/30 bg-red-900/5 p-3 text-sm text-red-900">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-7 w-full border border-black bg-[#181714] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F4EFE3] disabled:opacity-50 md:mt-6 md:w-auto md:py-3 md:text-xs"
          >
            {submitting ? "Submitting…" : "Submit Candidate Intake"}
          </button>
        </section>
      </div>
    </form>
  );
}

function Section({
  id,
  index,
  eyebrow,
  title,
  children,
}: {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 border-t border-black/20 px-5 py-4 md:px-8 md:py-5"
    >
      <div className="mb-4 border-b border-black/20 bg-black/[0.025] px-3 py-2 md:mb-5">
        <div className="flex gap-3 md:gap-4">
          <span className="font-mono text-[11px] leading-4 text-black/35 md:text-xs">
            {index}
          </span>

          <div>
            <p className="text-[11px] uppercase leading-4 tracking-[0.16em] text-black/45 md:text-xs md:tracking-[0.2em]">
              {eyebrow}
            </p>

            <h2 className="mt-1 max-w-[18rem] font-serif text-[1.25rem] leading-[1.15] text-[#181714] md:max-w-none md:text-xl md:leading-normal">
              {title}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 md:gap-4">{children}</div>;
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] uppercase leading-4 tracking-[0.12em] text-black/50 md:text-xs md:tracking-[0.15em]">
        {label}
      </span>

      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="border-b border-black/40 bg-white/10 px-1 py-2.5 text-[15px] leading-6 text-[#181714] outline-none transition focus:border-black focus:bg-white/35 md:py-2 md:text-sm md:leading-normal"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  hint,
  required = false,
  defaultValue,
  density = "narrative",
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  density?: "compact" | "narrative";
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] uppercase leading-4 tracking-[0.12em] text-black/50 md:text-xs md:tracking-[0.15em]">
        {label}
      </span>

      <textarea
        name={name}
        rows={3}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={[
          "resize-y border border-black/25 bg-black/[0.025] px-3 py-2 text-[15px] leading-6 text-[#181714] outline-none transition focus:border-black/60 focus:bg-white/45 md:text-sm",
          density === "compact"
            ? "min-h-[3rem]"
            : "min-h-[6rem] md:min-h-[6.5rem]",
        ].join(" ")}
      />

      {hint ? (
        <span className="text-[11px] leading-4 text-black/40 md:text-xs">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
