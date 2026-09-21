"use client";

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
    body: "I will not invent, alter, extend, or communicate commercial terms beyond those expressly authorized by French-Ward.",
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
    body: "I confirm that the information submitted is accurate and complete to the best of my knowledge.",
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
      const response = await fetch(
        "/api/french-ward/representative-program/onboarding",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify(payload),
        },
      );

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
      <section className="border-t border-black/20 px-6 py-12 md:px-12">
        <p className="text-xs uppercase tracking-[0.24em] text-black/50">
          Current State
        </p>

        <h2 className="mt-3 font-serif text-3xl text-[#181714]">
          {submitted
            ? "Submission received."
            : candidate.status.replaceAll("_", " ")}
        </h2>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-black/65">
          Your candidate record remains under French-Ward governance. Submission
          does not constitute qualification, Program admission, appointment,
          mandate, or delegated authority.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="border-t border-black/20">
      <Section
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
              existing?.identity.fullLegalName ?? candidate.candidateDisplayName
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
            defaultValue={existing?.identity.email ?? candidate.candidateEmail}
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
            name="companyOrOrganizationAffiliations"
            hint="One per line or comma-separated."
            defaultValue={initialList(
              existing?.professionalProfile.companyOrOrganizationAffiliations,
            )}
          />

          <TextArea
            label="Relevant Markets / Industries"
            name="relevantMarketsOrIndustries"
            hint="One per line or comma-separated."
            defaultValue={initialList(
              existing?.professionalProfile.relevantMarketsOrIndustries,
            )}
          />

          <TextArea
            label="Primary Territories"
            name="primaryTerritories"
            hint="Countries, regions, or corridors."
            defaultValue={initialList(
              existing?.professionalProfile.primaryTerritories,
            )}
          />

          <TextArea
            label="Languages"
            name="languages"
            hint="One per line or comma-separated."
            defaultValue={initialList(existing?.professionalProfile.languages)}
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
        index="04"
        eyebrow="Disclosures"
        title="Surface conditions that French-Ward should know."
      >
        <TextArea
          label="Existing Mandates / Representative Relationships"
          name="existingMandatesOrRepresentativeRelationships"
          defaultValue={
            existing?.disclosures.existingMandatesOrRepresentativeRelationships
          }
        />

        <TextArea
          label="Potential Conflicts"
          name="potentialConflicts"
          defaultValue={existing?.disclosures.potentialConflicts}
        />

        <TextArea
          label="Regulated Activities"
          name="regulatedActivities"
          defaultValue={existing?.disclosures.regulatedActivities}
        />

        <TextArea
          label="Material Affiliations"
          name="materialAffiliations"
          defaultValue={existing?.disclosures.materialAffiliations}
        />
      </Section>

      <Section
        index="05"
        eyebrow="Candidate Assertions"
        title="Confirm the conditions of entry."
      >
        <div className="grid gap-3">
          {acknowledgementFields.map(({ key, title, body }) => (
            <label
              key={key}
              className="flex gap-4 border border-black/20 bg-white/20 p-4"
            >
              <input
                type="checkbox"
                name={key}
                required
                defaultChecked={existing?.acknowledgements[key] ?? false}
                className="mt-1 h-4 w-4 accent-black"
              />

              <span>
                <strong className="block text-sm font-semibold text-[#181714]">
                  {title}
                </strong>

                <span className="mt-1 block text-xs leading-6 text-black/65">
                  {body}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Section>

      <section className="border-t border-black/20 px-6 py-10 md:px-12">
        <p className="max-w-3xl text-xs leading-6 text-black/55">
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
          className="mt-6 border border-black bg-[#181714] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#F4EFE3] disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Candidate Intake"}
        </button>
      </section>
    </form>
  );
}

function Section({
  index,
  eyebrow,
  title,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-black/20 px-6 py-10 md:px-12">
      <div className="mb-7 flex gap-5">
        <span className="font-mono text-xs text-black/35">{index}</span>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">
            {eyebrow}
          </p>

          <h2 className="mt-2 font-serif text-2xl text-[#181714]">{title}</h2>
        </div>
      </div>

      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
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
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.15em] text-black/50">
        {label}
      </span>

      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="border-b border-black/30 bg-transparent px-0 py-2 text-sm text-[#181714] outline-none focus:border-black"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.15em] text-black/50">
        {label}
      </span>

      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue ?? ""}
        className="resize-y border border-black/20 bg-white/15 p-3 text-sm leading-6 text-[#181714] outline-none focus:border-black/50"
      />

      {hint ? <span className="text-xs text-black/40">{hint}</span> : null}
    </label>
  );
}
