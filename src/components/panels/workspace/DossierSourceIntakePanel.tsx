"use client";

type SourceIntake = {
  id: string;
  reference: string;

  submitterName: string;
  submitterEmail: string;
  submitterPhone: string | null;
  submitterCompany: string | null;
  submitterCountry: string | null;
  submitterRole: string;

  representedPartyType: string | null;
  representedPartyName: string | null;
  authorizationStatus: string | null;

  transactionType: string | null;
  commodity: string | null;
  quantity: string | null;
  origin: string | null;
  destination: string | null;

  buyerName: string | null;
  buyerRegistrationNumber: string | null;
  buyerCountryOfIncorporation: string | null;
  buyerCorporateEmail: string | null;
  buyerCorporatePhone: string | null;

  buyerRepresentativeName: string | null;
  buyerRepresentativeTitle: string | null;
  buyerRepresentativeEntity: string | null;
  buyerRepresentativeRelationship: string | null;

  authorityToRepresent: boolean;
  authorityToNegotiate: boolean;
  authorityToSign: boolean;
  authorityOther: string | null;

  requestedPurity: string | null;
  transactionPurpose: string | null;
  transactionWindow: string | null;
  continuingSupplyIntent: string | null;
  recurringQuantity: string | null;
  recurringFrequency: string | null;
  desiredTerm: string | null;
  destinationStatus: string | null;
  buyerRequirements: string | null;

  deliveryPathway: string | null;
  deliveryPoint: string | null;
  refineryJurisdiction: string | null;
  assayPosture: string | null;
  additionalAssayRequirements: string | null;

  settlementPathway: string | null;
  settlementRail: string | null;
  settlementCurrencyAsset: string | null;
  settlementTimingRequirement: string | null;
  bankMessageFormat: string | null;
  digitalAsset: string | null;
  digitalAssetNetwork: string | null;
  additionalSettlementAuthorityRequired: string | null;
  additionalSettlementAuthorityDetail: string | null;
  financialCapacityStatus: string | null;

  incorporationRecordAvailable: boolean;
  kybRecordAvailable: boolean;
  representativeIdAvailable: boolean;
  authorityDocumentAvailable: boolean;
  specialComplianceRequirements: string | null;
  specialComplianceDetail: string | null;

  authorizedSubmitterEntity: string | null;
  authorizedSubmitterRepresentative: string | null;
  authorizedSubmitterPosition: string | null;
  authorizedSubmissionDate: string | null;

  promotedAt: string | null;
  promotedBy: string | null;
};

type Props = {
  sourceIntake: SourceIntake | null;
};

function Value({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-neutral-600">
        {label}
      </div>

      <div className="mt-1 text-xs text-neutral-300">
        {value?.trim() || "—"}
      </div>
    </div>
  );
}

function Availability({
  label,
  available,
}: {
  label: string;
  available: boolean;
}) {
  return (
    <div
      className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${
        available
          ? "border-cyan-900 bg-cyan-950/10 text-cyan-300"
          : "border-neutral-800 bg-black/20 text-neutral-600"
      }`}
    >
      {label}: {available ? "Declared Available" : "Not Declared"}
    </div>
  );
}

function Authority({
  label,
  declared,
}: {
  label: string;
  declared: boolean;
}) {
  return (
    <div
      className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${
        declared
          ? "border-amber-900 bg-amber-950/10 text-amber-300"
          : "border-neutral-800 bg-black/20 text-neutral-600"
      }`}
    >
      {label}: {declared ? "Declared" : "Not Declared"}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-black/25 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        {title}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

export function DossierSourceIntakePanel({
  sourceIntake,
}: Props) {
  if (!sourceIntake) {
    return (
      <section className="rounded-xl border border-neutral-800 bg-black/30 p-4">
        <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
          Source Intake Context
        </div>

        <div className="mt-3 rounded border border-amber-900 bg-amber-950/10 p-3 text-xs text-amber-300">
          No canonical Transaction Intake is linked. This dossier originated
          from an outside-gate opportunity and requires operator-supplied source
          context.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-black/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            Source Intake Context
          </div>

          <h3 className="mt-1 text-lg font-semibold text-white">
            Declared Context Carried Into Review
          </h3>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
            Canonical source data from {sourceIntake.reference}. These values
            are carried forward for operator review; they are not verification,
            approval, or KYC completion.
          </p>
        </div>

        <a
          href={`/admin/transaction-intakes/${sourceIntake.id}`}
          className="rounded border border-cyan-900 bg-cyan-950/10 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700"
        >
          Open Canonical Intake
        </a>
      </div>

      <div className="mt-4 grid gap-3">
        <Section title="Counterparty Identity">
          <Value label="Buyer" value={sourceIntake.buyerName} />
          <Value
            label="Registration"
            value={sourceIntake.buyerRegistrationNumber}
          />
          <Value
            label="Country of Incorporation"
            value={sourceIntake.buyerCountryOfIncorporation}
          />
          <Value
            label="Corporate Email"
            value={sourceIntake.buyerCorporateEmail}
          />
          <Value
            label="Corporate Phone"
            value={sourceIntake.buyerCorporatePhone}
          />
          <Value
            label="Represented Party"
            value={[
              sourceIntake.representedPartyType,
              sourceIntake.representedPartyName,
            ]
              .filter(Boolean)
              .join(" — ")}
          />
        </Section>

        <Section title="Representative Authority">
          <Value
            label="Representative"
            value={sourceIntake.buyerRepresentativeName}
          />
          <Value
            label="Title"
            value={sourceIntake.buyerRepresentativeTitle}
          />
          <Value
            label="Entity"
            value={sourceIntake.buyerRepresentativeEntity}
          />
          <Value
            label="Relationship"
            value={sourceIntake.buyerRepresentativeRelationship}
          />

          <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-2">
            <Authority
              label="Represent"
              declared={sourceIntake.authorityToRepresent}
            />
            <Authority
              label="Negotiate"
              declared={sourceIntake.authorityToNegotiate}
            />
            <Authority
              label="Sign"
              declared={sourceIntake.authorityToSign}
            />
          </div>

          <Value
            label="Other Authority"
            value={sourceIntake.authorityOther}
          />
        </Section>

        <Section title="Commercial Profile">
          <Value
            label="Transaction Type"
            value={sourceIntake.transactionType}
          />
          <Value
            label="Commodity"
            value={sourceIntake.commodity}
          />
          <Value
            label="Quantity"
            value={sourceIntake.quantity}
          />
          <Value
            label="Requested Purity"
            value={sourceIntake.requestedPurity}
          />
          <Value
            label="Purpose"
            value={sourceIntake.transactionPurpose}
          />
          <Value
            label="Transaction Window"
            value={sourceIntake.transactionWindow}
          />
          <Value
            label="Continuing Supply"
            value={sourceIntake.continuingSupplyIntent}
          />
          <Value
            label="Recurring Quantity"
            value={sourceIntake.recurringQuantity}
          />
          <Value
            label="Recurring Frequency"
            value={sourceIntake.recurringFrequency}
          />
          <Value
            label="Desired Term"
            value={sourceIntake.desiredTerm}
          />
          <Value
            label="Destination Status"
            value={sourceIntake.destinationStatus}
          />
          <Value
            label="Buyer Requirements"
            value={sourceIntake.buyerRequirements}
          />
        </Section>

        <Section title="Delivery / Assay">
          <Value
            label="Origin"
            value={sourceIntake.origin}
          />
          <Value
            label="Destination"
            value={sourceIntake.destination}
          />
          <Value
            label="Delivery Pathway"
            value={sourceIntake.deliveryPathway}
          />
          <Value
            label="Delivery Point"
            value={sourceIntake.deliveryPoint}
          />
          <Value
            label="Refinery Jurisdiction"
            value={sourceIntake.refineryJurisdiction}
          />
          <Value
            label="Assay Posture"
            value={sourceIntake.assayPosture}
          />
          <Value
            label="Additional Assay Requirements"
            value={sourceIntake.additionalAssayRequirements}
          />
        </Section>

        <Section title="Settlement / Financial Capacity">
          <Value
            label="Settlement Pathway"
            value={sourceIntake.settlementPathway}
          />
          <Value
            label="Settlement Rail"
            value={sourceIntake.settlementRail}
          />
          <Value
            label="Currency / Asset"
            value={sourceIntake.settlementCurrencyAsset}
          />
          <Value
            label="Timing Requirement"
            value={sourceIntake.settlementTimingRequirement}
          />
          <Value
            label="Bank Message Format"
            value={sourceIntake.bankMessageFormat}
          />
          <Value
            label="Digital Asset"
            value={sourceIntake.digitalAsset}
          />
          <Value
            label="Digital Asset Network"
            value={sourceIntake.digitalAssetNetwork}
          />
          <Value
            label="Additional Settlement Authority"
            value={sourceIntake.additionalSettlementAuthorityRequired}
          />
          <Value
            label="Authority Detail"
            value={sourceIntake.additionalSettlementAuthorityDetail}
          />
          <Value
            label="Financial Capacity"
            value={sourceIntake.financialCapacityStatus}
          />
        </Section>

        <Section title="Documentary Readiness / Compliance">
          <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-2">
            <Availability
              label="Incorporation Record"
              available={sourceIntake.incorporationRecordAvailable}
            />
            <Availability
              label="KYB Record"
              available={sourceIntake.kybRecordAvailable}
            />
            <Availability
              label="Representative ID"
              available={sourceIntake.representativeIdAvailable}
            />
            <Availability
              label="Authority Document"
              available={sourceIntake.authorityDocumentAvailable}
            />
          </div>

          <Value
            label="Special Compliance Requirement"
            value={sourceIntake.specialComplianceRequirements}
          />
          <Value
            label="Compliance Detail"
            value={sourceIntake.specialComplianceDetail}
          />
        </Section>

        <Section title="Authorized Submission">
          <Value
            label="Entity"
            value={sourceIntake.authorizedSubmitterEntity}
          />
          <Value
            label="Representative"
            value={sourceIntake.authorizedSubmitterRepresentative}
          />
          <Value
            label="Position"
            value={sourceIntake.authorizedSubmitterPosition}
          />
          <Value
            label="Submission Date"
            value={sourceIntake.authorizedSubmissionDate}
          />
          <Value
            label="Promoted By"
            value={sourceIntake.promotedBy}
          />
          <Value
            label="Promoted At"
            value={
              sourceIntake.promotedAt
                ? new Date(sourceIntake.promotedAt).toLocaleString()
                : null
            }
          />
        </Section>
      </div>
    </section>
  );
}
