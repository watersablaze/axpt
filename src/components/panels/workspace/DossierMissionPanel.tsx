"use client";

type SourceOpportunity = {
  id: string;
  title: string;
  source: string;
  status: string;
  sourceIntake: {
    id: string;
    reference: string;
    referralCode: string | null;
    referredByName: string | null;
    referredByCompany: string | null;
    submitterName: string;
    submitterEmail: string;
    promotedAt: string | null;
    promotedBy: string | null;
  } | null;
};

type Props = {
  commodity: string | null;
  quantityKg: string | null;
  origin: string | null;
  settlement: string | null;
  currentState: string;
  nextStates: string[];
  sourceOpportunity?: SourceOpportunity | null;
  seededFields?: string[];
};

function formatState(state: string) {
  return state.replace(/_/g, " ");
}

function getCurrentObjective(currentState: string, nextStates: string[]) {
  const nextState = nextStates[0] ?? null;

  if (!nextState) {
    return "No immediate objective available. Monitor dossier state and confirm whether closure, archive, or manual review is required.";
  }

  switch (currentState) {
    case "INTAKE_PENDING":
      return `Prepare dossier for ${formatState(
        nextState,
      )}. Confirm parties, commodity, and commercial readiness.`;

    case "KYC_REVIEW":
      return `Complete KYC verification before moving toward ${formatState(
        nextState,
      )}.`;

    case "SPA_DRAFTING":
      return `Prepare and validate the SPA package before moving toward ${formatState(
        nextState,
      )}.`;

    case "SPA_EXECUTED":
      return `Confirm executed SPA and prepare escrow pathway toward ${formatState(
        nextState,
      )}.`;

    case "ESCROW_PENDING":
      return `Confirm escrow setup and funding readiness before moving toward ${formatState(
        nextState,
      )}.`;

    case "ESCROW_FUNDED":
      return `Confirm escrow funding and prepare treasury execution toward ${formatState(
        nextState,
      )}.`;

    case "TREASURY_PENDING":
      return `Prepare treasury release conditions before moving toward ${formatState(
        nextState,
      )}.`;

    case "EXPORT_RELEASED":
      return `Confirm export release and prepare activation toward ${formatState(
        nextState,
      )}.`;

    case "EXPORT_ACTIVE":
      return `Track active export execution toward ${formatState(nextState)}.`;

    case "IN_TRANSIT":
      return `Monitor shipment movement and prepare refinery intake toward ${formatState(
        nextState,
      )}.`;

    case "REFINERY_INTAKE":
      return `Confirm refinery receipt and prepare assay workflow toward ${formatState(
        nextState,
      )}.`;

    case "REFINERY_ASSAY":
    case "ASSAY_PENDING":
      return `Track assay completion and prepare settlement pathway toward ${formatState(
        nextState,
      )}.`;

    case "SETTLEMENT_PENDING":
      return `Confirm settlement readiness and close commercial obligations toward ${formatState(
        nextState,
      )}.`;

    default:
      return `Advance dossier toward ${formatState(nextState)}.`;
  }
}

function ReadinessPill({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div
      className={
        ready
          ? "rounded border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300"
          : "rounded border border-amber-900 bg-amber-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-300"
      }
    >
      {label} {ready ? "Present" : "Pending"}
    </div>
  );
}

export default function DossierMissionPanel({
  commodity,
  quantityKg,
  origin,
  settlement,
  currentState,
  nextStates,
  sourceOpportunity = null,
  seededFields = [],
}: Props) {
  const objective = getCurrentObjective(currentState, nextStates);

  const nextState = nextStates[0] ?? null;

  const sourceIntake = sourceOpportunity?.sourceIntake ?? null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Mission Brief
      </div>

      <div className="mt-3 rounded border border-cyan-900/60 bg-cyan-950/10 p-3">
        <div className="text-[10px] uppercase tracking-wide text-cyan-400/70">
          Current Objective
        </div>

        <div className="mt-1 text-sm leading-relaxed text-cyan-100">
          {objective}
        </div>
      </div>

      {sourceOpportunity || sourceIntake ? (
        <div className="mt-3 rounded border border-emerald-900/60 bg-emerald-950/10 p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-emerald-400/70">
                Origin Trace
              </div>

              <div className="mt-1 text-sm font-semibold text-emerald-100">
                {sourceIntake
                  ? `Seeded from Intake ${sourceIntake.reference}`
                  : "Seeded from promoted opportunity"}
              </div>

              <div className="mt-1 text-xs leading-5 text-emerald-100/70">
                {sourceOpportunity?.title ?? "Opportunity title unavailable"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
              {sourceIntake?.referralCode ? (
                <span className="rounded border border-emerald-800 bg-black/20 px-2 py-1 text-emerald-300">
                  Ref {sourceIntake.referralCode}
                </span>
              ) : null}

              {sourceIntake?.referredByName ? (
                <span className="rounded border border-emerald-800 bg-black/20 px-2 py-1 text-emerald-300">
                  By {sourceIntake.referredByName}
                </span>
              ) : null}

              {sourceOpportunity?.source ? (
                <span className="rounded border border-neutral-800 bg-black/20 px-2 py-1 text-neutral-400">
                  Source {sourceOpportunity.source}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-3 rounded border border-emerald-900/40 bg-black/20 p-2 text-xs leading-5 text-emerald-100/70">
            Seeded commercial details are carried forward for operator review.
            Confirm parties, settlement terms, documents, and authority before
            issuance.
          </div>

          {seededFields.length > 0 ? (
            <div className="mt-3 rounded border border-neutral-800 bg-black/20 p-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                Seeded Fields
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {seededFields.map((field: string) => (
                  <span
                    key={field}
                    className="rounded border border-emerald-900 bg-emerald-950/10 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300"
                  >
                    {field}
                  </span>
                ))}
              </div>

              <div className="mt-2 text-[10px] uppercase tracking-wide text-amber-300/80">
                Review Required Before Issuance
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Commercial Shape
          </div>

          <div className="mt-2 text-xs text-neutral-300">
            {commodity ?? "Commodity pending"}
            {" · "}
            {quantityKg ? `${quantityKg} KG` : "Quantity pending"}
            {" · "}
            {origin ?? "Origin pending"}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Next Move
          </div>

          <div className="mt-2 text-xs text-neutral-300">
            {nextState ? formatState(nextState) : "No next move available"}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Settlement
          </div>

          <div className="mt-2 text-xs text-neutral-300">
            {settlement ?? "Pending"}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Readiness
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <ReadinessPill label="Commodity" ready={Boolean(commodity)} />
            <ReadinessPill label="Quantity" ready={Boolean(quantityKg)} />
            <ReadinessPill label="Origin" ready={Boolean(origin)} />
          </div>
        </div>
      </div>
    </div>
  );
}
