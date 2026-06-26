"use client";

import { useEffect, useMemo, useState } from "react";

type GateCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
};

type GateResult = {
  passed: boolean;
  blockingReason?: string;
  checks: GateCheck[];
};

type TransitionConsequence = {
  type: string;
  label: string;
  detail: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
};

type TransitionPreview = {
  dossierId: string;
  reference: string;
  fromState: string;
  toState: string;
  executable: boolean;
  stateMachine: {
    passed: boolean;
  };
  artifactGate: GateResult;
  approvalGate: GateResult;
  consequences: TransitionConsequence[];
};

type PreviewResponse = {
  ok: boolean;
  preview?: TransitionPreview;
  error?: string;
};

type TransitionResponse = {
  ok: boolean;
  error?: string;
  reason?: string;
};

type Props = {
  dossierId: string;
  nextStates: string[];
  onTransitioned?: () => Promise<void>;
};

const EXCEPTION_STATES = new Set(["BLOCKED", "CANCELLED"]);

function gateTone(passed: boolean) {
  return passed
    ? "border-emerald-900 bg-emerald-950/20 text-emerald-300"
    : "border-red-900 bg-red-950/20 text-red-300";
}

function consequenceTone(severity: TransitionConsequence["severity"]) {
  switch (severity) {
    case "CRITICAL":
      return "border-red-900 bg-red-950/20 text-red-300";
    case "WARNING":
      return "border-amber-900 bg-amber-950/20 text-amber-300";
    case "INFO":
    default:
      return "border-cyan-900 bg-cyan-950/20 text-cyan-300";
  }
}

function GatePanel({
  title,
  gate,
  approvingCheckId,
  onGrantApproval,
}: {
  title: string;
  gate: GateResult;
  approvingCheckId?: string | null;
  onGrantApproval?: (check: GateCheck) => void;
}) {
  return (
    <div className="rounded border border-neutral-800 bg-black/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wide text-neutral-500">
          {title}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${gateTone(
            gate.passed,
          )}`}
        >
          {gate.passed ? "Clear" : "Blocked"}
        </div>
      </div>

      {gate.blockingReason ? (
        <div className="mt-2 text-xs text-red-300">{gate.blockingReason}</div>
      ) : null}

      <div className="mt-3 grid gap-2">
        {gate.checks.map((check) => (
          <div
            key={check.id}
            className="rounded border border-neutral-900 bg-black/20 p-2 text-xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-neutral-300">{check.label}</div>

                {check.detail ? (
                  <div className="mt-1 text-[11px] text-neutral-500">
                    {check.detail}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <div
                  className={
                    check.passed
                      ? "text-[10px] uppercase tracking-wide text-emerald-300"
                      : "text-[10px] uppercase tracking-wide text-red-300"
                  }
                >
                  {check.passed ? "Passed" : "Open"}
                </div>

                {!check.passed && onGrantApproval ? (
                  <button
                    type="button"
                    disabled={approvingCheckId === check.id}
                    onClick={() => onGrantApproval(check)}
                    className="rounded border border-amber-800 bg-amber-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-300 hover:border-amber-600 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                  >
                    {approvingCheckId === check.id
                      ? "Granting..."
                      : "Grant Approval"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransitionButton({
  state,
  selected,
  variant,
  onClick,
}: {
  state: string;
  selected: boolean;
  variant: "primary" | "exception";
  onClick: () => void;
}) {
  const selectedClass =
    variant === "primary"
      ? "border-cyan-700 bg-cyan-950/30 text-cyan-300"
      : "border-amber-700 bg-amber-950/20 text-amber-300";

  const idleClass =
    variant === "primary"
      ? "border-neutral-800 bg-black/30 text-neutral-400 hover:border-cyan-800 hover:text-cyan-300"
      : "border-neutral-800 bg-black/30 text-neutral-500 hover:border-amber-800 hover:text-amber-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-1.5 text-[10px] uppercase tracking-wide ${
        selected ? selectedClass : idleClass
      }`}
    >
      {state}
    </button>
  );
}

export default function TransitionActionBar({
  dossierId,
  nextStates,
  onTransitioned,
}: Props) {
  const { primaryStates, exceptionStates } = useMemo(
    () => ({
      primaryStates: nextStates.filter((state) => !EXCEPTION_STATES.has(state)),
      exceptionStates: nextStates.filter((state) =>
        EXCEPTION_STATES.has(state),
      ),
    }),
    [nextStates],
  );

  const [selectedState, setSelectedState] = useState(
    primaryStates[0] ?? nextStates[0] ?? "",
  );

  const [preview, setPreview] = useState<TransitionPreview | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);

  const [executing, setExecuting] = useState(false);

  const [approvingCheckId, setApprovingCheckId] = useState<string | null>(null);

  const [previewNonce, setPreviewNonce] = useState(0);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedState(primaryStates[0] ?? nextStates[0] ?? "");
  }, [nextStates, primaryStates]);

  useEffect(() => {
    if (!selectedState) {
      setPreview(null);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      setLoadingPreview(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/control-center/dossiers/${dossierId}/transition/preview`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              toState: selectedState,
            }),
          },
        );

        const payload = (await response.json()) as PreviewResponse;

        if (!response.ok || !payload.ok || !payload.preview) {
          throw new Error(payload.error ?? "TRANSITION_PREVIEW_FAILED");
        }

        if (!cancelled) {
          setPreview(payload.preview);
        }
      } catch (err) {
        if (!cancelled) {
          setPreview(null);
          setError(
            err instanceof Error ? err.message : "TRANSITION_PREVIEW_FAILED",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [dossierId, selectedState, previewNonce]);

  if (nextStates.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Execution Control
        </div>

        <div className="mt-3 text-xs text-neutral-500">
          No transition actions are currently available.
        </div>
      </div>
    );
  }

  async function grantTransitionApproval(check: GateCheck) {
    if (!preview || approvingCheckId) {
      return;
    }

    const requiredRole = check.label.replace(/ approval$/i, "").trim();

    setApprovingCheckId(check.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/dossiers/${dossierId}/approvals`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transitionKey: `${preview.fromState}_TO_${preview.toState}`,
            requiredRole,
            note: `Approved from transition preview for ${preview.fromState} → ${preview.toState}.`,
          }),
        },
      );

      const result = (await response.json()) as TransitionResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.reason ?? result.error ?? "APPROVAL_FAILED");
      }

      setPreviewNonce((value) => value + 1);
      await onTransitioned?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "APPROVAL_FAILED");
    } finally {
      setApprovingCheckId(null);
    }
  }

  async function executeTransition() {
    if (!selectedState || !preview?.executable || executing) {
      return;
    }

    const confirmed = window.confirm(
      `Transition dossier from ${preview.fromState} to ${preview.toState}?`,
    );

    if (!confirmed) return;

    setExecuting(true);
    setError(null);

    const response = await fetch(
      `/api/admin/control-center/dossiers/${dossierId}/transition`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toState: selectedState,
          message: `Dossier transitioned to ${selectedState}.`,
        }),
      },
    );

    const result = (await response.json()) as TransitionResponse;

    setExecuting(false);

    if (!response.ok || !result.ok) {
      setError(result.reason ?? result.error ?? "TRANSITION_FAILED");
      return;
    }

    await onTransitioned?.();
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Execution Control
      </div>

      <h3 className="mt-1 text-sm font-medium text-white">
        Transition Preview
      </h3>

      <p className="mt-1 max-w-2xl text-xs text-neutral-500">
        Select a target state, review gates and consequences, then advance the
        dossier only when the preview is executable.
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Primary Move
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {primaryStates.length === 0 ? (
              <div className="text-xs text-neutral-600">
                No primary move available.
              </div>
            ) : (
              primaryStates.map((state) => (
                <TransitionButton
                  key={state}
                  state={state}
                  selected={selectedState === state}
                  variant="primary"
                  onClick={() => setSelectedState(state)}
                />
              ))
            )}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Exception Moves
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {exceptionStates.length === 0 ? (
              <div className="text-xs text-neutral-600">
                No exception moves.
              </div>
            ) : (
              exceptionStates.map((state) => (
                <TransitionButton
                  key={state}
                  state={state}
                  selected={selectedState === state}
                  variant="exception"
                  onClick={() => setSelectedState(state)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded border border-red-900 bg-red-950/20 p-2 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {loadingPreview ? (
        <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-3 text-xs text-neutral-500">
          Loading transition preview...
        </div>
      ) : null}

      {preview ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 text-xs md:grid-cols-3">
            <div className="rounded border border-neutral-800 bg-black/30 p-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                From
              </div>
              <div className="mt-1 text-cyan-300">{preview.fromState}</div>
            </div>

            <div className="rounded border border-neutral-800 bg-black/30 p-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                To
              </div>
              <div className="mt-1 text-white">{preview.toState}</div>
            </div>

            <div className="rounded border border-neutral-800 bg-black/30 p-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Gate Result
              </div>
              <div
                className={
                  preview.executable
                    ? "mt-1 text-emerald-300"
                    : "mt-1 text-red-300"
                }
              >
                {preview.executable ? "Executable" : "Blocked"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <GatePanel title="Artifact Gate" gate={preview.artifactGate} />
            <GatePanel
              title="Approval Gate"
              gate={preview.approvalGate}
              approvingCheckId={approvingCheckId}
              onGrantApproval={(check) => void grantTransitionApproval(check)}
            />
          </div>

          <div className="rounded border border-neutral-800 bg-black/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                Consequences
              </div>

              <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
                {preview.consequences.length} Items
              </div>
            </div>

            {preview.consequences.length === 0 ? (
              <div className="mt-3 text-xs text-neutral-600">
                No generated consequences for this transition.
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                {preview.consequences.map((consequence) => (
                  <div
                    key={consequence.type}
                    className="rounded border border-neutral-900 bg-black/20 p-2 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-neutral-300">
                          {consequence.label}
                        </div>
                        <div className="mt-1 text-[11px] text-neutral-500">
                          {consequence.detail}
                        </div>
                      </div>

                      <div
                        className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${consequenceTone(
                          consequence.severity,
                        )}`}
                      >
                        {consequence.severity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!preview.executable || executing}
            onClick={() => void executeTransition()}
            className="w-full rounded border border-cyan-800 bg-cyan-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-600 disabled:cursor-not-allowed disabled:border-red-900 disabled:bg-red-950/20 disabled:text-red-300"
          >
            {executing
              ? "Advancing..."
              : preview.executable
                ? `Advance to ${preview.toState}`
                : "Blocked · resolve gates first"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
