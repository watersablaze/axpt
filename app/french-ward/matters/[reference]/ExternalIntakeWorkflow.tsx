"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import styles from "./matter.module.css";

type Props = {
  intakeId: string;
  matterId: string;
  adoptionDecisionId: string | null;
  opportunityId: string | null;
  opportunityApproved: boolean;
  dossierId: string | null;
  state: string;
};

const errors: Record<string, string> = {
  UNAUTHORIZED: "Sign in again and retry.",
  WORKFLOW_ACCESS_DENIED: "Your current standing, permissions, or Matter scope do not authorize this action.",
  DOSSIER_ARTIFACT_GATE_BLOCKED: "Complete the current KYC review and any missing Dossier prerequisites in Control Center, then retry.",
  OPPORTUNITY_NOT_APPROVED: "Approve the Opportunity in Control Center, then return here.",
  FW_EXTERNAL_ADOPTION_DECISION_CONFLICT: "An adoption decision already exists with different evidence. Refresh and review the Matter.",
  FW_DOSSIER_EXPECTED_STATE_MISMATCH: "The Dossier state changed. Refresh the Matter and review its current stage.",
};

export default function ExternalIntakeWorkflow(props: Props) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => setHydrated(true), []);
  const [error, setError] = useState("");

  const { intakeId, matterId, adoptionDecisionId, opportunityId, dossierId, state } = props;
  const decision = { adoptionDecisionId };
  const pair = { intakeId, matterId };
  let command: Record<string, string | null> | null = null;
  let label = "";
  let instruction = "";

  if (!adoptionDecisionId) {
    command = { operation: "ADOPT", ...pair };
    label = "Record adoption decision";
  } else if (dossierId && state === "INTAKE_PENDING") {
    command = { operation: "OPEN_KYC_REVIEW", dossierId, ...decision };
    label = "Open KYC review";
  } else if (dossierId && state === "KYC_REVIEW") {
    command = { operation: "OPEN_SPA_DRAFTING", dossierId, ...decision };
    label = "Open SPA Drafting";
    instruction = "Confirm KYC review in Control Center before opening SPA Drafting.";
  } else if (dossierId) {
    instruction = state === "SPA_DRAFTING"
      ? "This Matter has reached SPA Drafting."
      : "Continue Dossier work in Control Center.";
  } else if (opportunityId && props.opportunityApproved) {
    command = { operation: "CREATE_DOSSIER", opportunityId, ...decision };
    label = "Create Dossier";
  } else if (opportunityId) {
    instruction = "Approve the Opportunity in Control Center, then return to this Matter.";
  } else {
    command = { operation: "PROMOTE", ...pair, ...decision };
    label = "Promote to Opportunity";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated || !command || pending) return;

    const form = new FormData(event.currentTarget);
    const body = command.operation === "ADOPT"
      ? {
          ...command,
          reviewedCoordinationAuthorityReference: form.get("authorityReference"),
          provenanceFindings: form.get("provenanceFindings"),
        }
      : command;

    setError("");
    setPending(true);
    let refreshing = false;
    try {
      const response = await fetch("/api/french-ward/external-intake-workflow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setError(errors[result.error] ?? "The operation could not be completed. Refresh the Matter before retrying.");
        return;
      }
      refreshing = true;
      router.refresh();
    } catch {
      setError("The workflow endpoint could not be reached. Refresh the Matter before retrying.");
    } finally {
      if (!refreshing) setPending(false);
    }
  }

  return (
    <section aria-label="External intake workflow">
      <h3>External intake workflow</h3>
      {instruction ? (
        <p className={styles.recordNote}>
          {instruction}{" "}
          <Link className={styles.back} href="/admin/control-center">
            Open Control Center →
          </Link>
        </p>
      ) : null}
      {command ? (
        <form method="post" onSubmit={submit}>
          {command.operation === "ADOPT" ? (
            <>
              <p>
                <label>
                  Reviewed coordination authority reference{" "}
                  <input name="authorityReference" required maxLength={500} />
                </label>
              </p>
              <p>
                <label>
                  Provenance findings{" "}
                  <textarea name="provenanceFindings" required maxLength={4000} />
                </label>
              </p>
            </>
          ) : null}
          <button type="submit" className={styles.promoteButton} disabled={!hydrated || pending}>
            {pending ? "Working…" : label}
          </button>
        </form>
      ) : null}
      {error ? <p role="alert" className={styles.recordNote}>{error}</p> : null}
    </section>
  );
}
