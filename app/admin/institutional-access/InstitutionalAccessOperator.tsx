"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Event = {
  id: string;
  type: string;
  occurredAt: string;
  reason: string | null;
};

type Request = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  institutionalAffiliation: string;
  requesterCapacity: string;
  purpose: string;
  scope: string;
  resourceReference: string;
  resourceVersion: number;
  status: string;
  decisionPolicy: string | null;
  currentResourceVersion: number;
  isCurrentResource: boolean;
  createdAt: string;
  decidedAt: string | null;
  decisionReason: string | null;
  recipientUserId: string | null;
  grant: {
    id: string;
    expiresAt: string;
    revokedAt: string | null;
    recipientEmail: string;
    firstAccessAt: string | null;
    lastAccessAt: string | null;
  } | null;
  events: Event[];
};

type Provenance = {
  kind: string;
  label: string;
  dossierId: string | null;
  dossierPurpose: string | null;
  dossierRevokedAt: string | null;
};

type Grant = {
  id: string;
  requestId: string;
  recipientUserId: string;
  recipientEmail: string;
  recipientName: string;
  institutionalAffiliation: string;
  requesterCapacity: string;
  purpose: string;
  requestStatus: string;
  decisionPolicy: string | null;
  scope: string;
  resourceReference: string;
  resourceVersion: number;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  firstAccessAt: string | null;
  lastAccessAt: string | null;
  state: "CURRENT" | "REVOKED" | "EXPIRED" | "SCHEDULED";
  provenance: Provenance;
};

type ProfileNotice = {
  status: string;
  messageId: string | null;
  attemptedAt: string;
};

type ProfileNotices = Record<string, ProfileNotice>;

type Mode =
  | "MANAGE"
  | "DECIDE"
  | "HISTORY";

const panel: React.CSSProperties = {
  border: "1px solid #26384d",
  background: "#0b1420",
};

const inset: React.CSSProperties = {
  border: "1px solid #2f4359",
  background: "#0d1725",
};

const muted: React.CSSProperties = {
  color: "#91a4bb",
};

const field: React.CSSProperties = {
  width: "100%",
  background: "#0c1421",
  color: "#edf1f7",
  border: "1px solid #33445b",
  padding: "10px 12px",
  borderRadius: 4,
};

const button: React.CSSProperties = {
  background: "#1b3552",
  color: "#fff",
  padding: "10px 14px",
  border: "1px solid #536b85",
  cursor: "pointer",
  borderRadius: 4,
};

const subtleButton: React.CSSProperties = {
  ...button,
  background: "#101d2b",
};

const dangerButton: React.CSSProperties = {
  ...button,
  background: "#26191b",
  border: "1px solid #765154",
};

function shortDate(value: string | null) {
  if (!value) return "—";
  return value.slice(0, 16).replace("T", " ");
}

function stateColor(value: string) {
  if (value === "CURRENT" || value === "APPROVED") {
    return "#9bd1b2";
  }

  if (value === "PENDING") {
    return "#e0bd7d";
  }

  if (value === "REVOKED" || value === "DECLINED") {
    return "#c79696";
  }

  return "#91a4bb";
}

function stateLabel(
  value: string,
): React.CSSProperties {
  return {
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: stateColor(value),
  };
}

function scopeLabel(scope: string) {
  switch (scope) {
    case "PROFILE_VIEW":
      return "Institutional Profile";
    case "SOURCE_AUTHORITY_VIEW":
      return "Source Authority";
    case "LOI_INTAKE_ACCESS":
      return "Commercial Intake";
    case "SUPPORTING_DOCUMENT_VIEW":
      return "Supporting Document";
    default:
      return scope;
  }
}

export function InstitutionalAccessOperator({
  requests,
  grants,
  notices,
  initialRequestId,
}: {
  requests: Request[];
  grants: Grant[];
  notices: ProfileNotices;
  initialRequestId: string | null;
}) {
  const router = useRouter();

  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status === "PENDING",
      ),
    [requests],
  );

  const currentGrants = useMemo(
    () =>
      grants.filter(
        (grant) =>
          grant.state === "CURRENT",
      ),
    [grants],
  );

  const historicalGrants = useMemo(
    () =>
      grants.filter(
        (grant) =>
          grant.state !== "CURRENT",
      ),
    [grants],
  );

  const historicalRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status !== "PENDING",
      ),
    [requests],
  );

  const recipientGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        userId: string;
        email: string;
        name: string;
        affiliation: string;
        grants: Grant[];
      }
    >();

    for (const grant of currentGrants) {
      const key =
        grant.recipientUserId ||
        grant.recipientEmail.toLowerCase();

      const existing = groups.get(key);

      if (existing) {
        existing.grants.push(grant);
        continue;
      }

      groups.set(key, {
        key,
        userId: grant.recipientUserId,
        email: grant.recipientEmail,
        name: grant.recipientName,
        affiliation:
          grant.institutionalAffiliation,
        grants: [grant],
      });
    }

    return [...groups.values()];
  }, [currentGrants]);

  const initialRequest =
    requests.find(
      (request) =>
        request.id === initialRequestId,
    ) ??
    pendingRequests[0] ??
    requests[0];

  const initialMode: Mode =
    initialRequest?.status === "PENDING"
      ? "DECIDE"
      : "MANAGE";

  const [mode, setMode] =
    useState<Mode>(initialMode);

  const [
    selectedRequestId,
    setSelectedRequestId,
  ] = useState(
    initialRequest?.id ?? "",
  );

  const [
    selectedRecipientKey,
    setSelectedRecipientKey,
  ] = useState(
    recipientGroups[0]?.key ?? "",
  );

  const initialRecipient =
    recipientGroups.find(
      (group) =>
        group.key ===
        selectedRecipientKey,
    ) ?? recipientGroups[0];

  const [
    selectedGrantId,
    setSelectedGrantId,
  ] = useState(
    initialRecipient?.grants[0]?.id ??
      "",
  );

  const [reason, setReason] =
    useState("");

  const [expires, setExpires] =
    useState("");

  const [
    revokeReason,
    setRevokeReason,
  ] = useState("");

  const [busy, setBusy] =
    useState(false);

  const [, setFeedback] =
    useState("");

  const [
    busyAction,
    setBusyAction,
  ] = useState<
    | "APPROVED"
    | "DECLINED"
    | "REVOKE"
    | "NOTICE"
    | null
  >(null);

  const [
    operationReceipt,
    setOperationReceipt,
  ] = useState<{
    tone:
      | "working"
      | "success"
      | "error";
    title: string;
    detail: string;
  } | null>(null);

  const [
    focusRecipientEmail,
    setFocusRecipientEmail,
  ] = useState<string | null>(
    null,
  );

  const [
    noticeHold,
    setNoticeHold,
  ] = useState<string | null>(null);

  const selectedRequest =
    requests.find(
      (request) =>
        request.id ===
        selectedRequestId,
    );

  const selectedRecipient =
    recipientGroups.find(
      (group) =>
        group.key ===
        selectedRecipientKey,
    ) ?? recipientGroups[0];

  const selectedGrant =
    selectedRecipient?.grants.find(
      (grant) =>
        grant.id === selectedGrantId,
    ) ??
    selectedRecipient?.grants[0];

  useEffect(() => {
    if (!focusRecipientEmail) {
      return;
    }

    const recipient =
      recipientGroups.find(
        (group) =>
          group.email
            .trim()
            .toLowerCase() ===
          focusRecipientEmail,
      );

    if (!recipient) {
      return;
    }

    setSelectedRecipientKey(
      recipient.key,
    );

    setSelectedGrantId(
      recipient.grants[0]?.id ?? "",
    );

    setFocusRecipientEmail(null);
  }, [
    focusRecipientEmail,
    recipientGroups,
  ]);

  const selectedGrantRequest =
    selectedGrant
      ? requests.find(
          (request) =>
            request.id ===
            selectedGrant.requestId,
        )
      : undefined;

  const currentNotice =
    selectedGrantRequest
      ? notices[selectedGrantRequest.id]
      : undefined;

  const noticeNeedsReconciliation =
    currentNotice?.status ===
      "SENDING" ||
    currentNotice?.status ===
      "DELIVERY_UNKNOWN";

  const profileNoticeEligible =
    Boolean(
      selectedGrant &&
        selectedGrant.scope ===
          "PROFILE_VIEW" &&
        selectedGrant.state ===
          "CURRENT" &&
        selectedGrantRequest &&
        selectedGrantRequest.status ===
          "APPROVED",
    );

  function selectMode(next: Mode) {
    setMode(next);
    setFeedback("");
    setOperationReceipt(null);
    setReason("");
    setExpires("");
    setRevokeReason("");
  }

  function selectRecipient(
    key: string,
  ) {
    const recipient =
      recipientGroups.find(
        (group) =>
          group.key === key,
      );

    setSelectedRecipientKey(key);
    setSelectedGrantId(
      recipient?.grants[0]?.id ?? "",
    );
    setRevokeReason("");
    setFeedback("");
    setOperationReceipt(null);
  }

  function selectGrant(id: string) {
    setSelectedGrantId(id);
    setRevokeReason("");
    setFeedback("");
    setOperationReceipt(null);
  }

  function selectRequest(
    id: string,
  ) {
    setSelectedRequestId(id);
    setReason("");
    setExpires("");
    setFeedback("");
    setOperationReceipt(null);
  }

  async function mutate(
    action:
      | "APPROVED"
      | "DECLINED"
      | "REVOKE",
    id: string,
  ) {
    const activeReason =
      action === "REVOKE"
        ? revokeReason
        : reason;

    if (!activeReason.trim()) {
      setFeedback(
        "A reason is required.",
      );

      setOperationReceipt({
        tone: "error",
        title:
          "Reason required",
        detail:
          "Enter an operator reason before recording this action.",
      });

      return;
    }

    if (
      !window.confirm(
        `Confirm ${action.toLowerCase()}? This writes an institutional access record.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setBusyAction(action);
    setFeedback("");

    const actingRequest =
      action !== "REVOKE"
        ? requests.find(
            (request) =>
              request.id === id,
          )
        : undefined;

    setOperationReceipt({
      tone: "working",
      title:
        action === "APPROVED"
          ? "Approving access…"
          : action === "DECLINED"
            ? "Declining request…"
            : "Revoking access…",
      detail:
        action === "APPROVED"
          ? "Recording the grant and binding recipient access."
          : action === "DECLINED"
            ? "Recording the operator decision."
            : "Revoking the selected permission.",
    });

    try {
      const response = await fetch(
        action === "REVOKE"
          ? "/api/admin/institutional-access/revoke"
          : "/api/admin/institutional-access/decision",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            action === "REVOKE"
              ? {
                  grantId: id,
                  reason:
                    activeReason,
                }
              : {
                  requestId: id,
                  decision:
                    action,
                  reason:
                    activeReason,
                  ...(action ===
                  "APPROVED"
                    ? {
                        expiresAt:
                          new Date(
                            expires,
                          ).toISOString(),
                      }
                    : {}),
                },
          ),
        },
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ||
            "Operator action failed.",
        );
      }

      if (
        action === "APPROVED"
      ) {
        const recipientName =
          actingRequest
            ?.requesterName ??
          "Recipient";

        const resourceLabel =
          actingRequest?.scope ===
          "PROFILE_VIEW"
            ? `Institutional Profile v${actingRequest.resourceVersion}`
            : actingRequest
                ?.resourceReference ??
              "Institutional resource";

        setOperationReceipt({
          tone: "success",
          title:
            "Access approved",
          detail:
            `${recipientName} · ${resourceLabel}. ` +
            "The grant is active. Notification has not been sent yet.",
        });

        if (actingRequest) {
          setFocusRecipientEmail(
            actingRequest
              .requesterEmail
              .trim()
              .toLowerCase(),
          );
        }

        // Move the operator directly into the recipient's
        // effective-access workspace. The useEffect above
        // resolves the new recipient/grant once refresh
        // supplies the updated server projection.
        setMode("MANAGE");
      } else if (
        action === "DECLINED"
      ) {
        setOperationReceipt({
          tone: "success",
          title:
            "Request declined",
          detail:
            `${actingRequest?.requesterName ?? "Recipient"} · ` +
            "The decision has been recorded. No notification was sent.",
        });
      } else {
        setOperationReceipt({
          tone: "success",
          title:
            "Access revoked",
          detail:
            "The selected permission has been revoked.",
        });
      }

      setFeedback("");
      setReason("");
      setExpires("");
      setRevokeReason("");

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Action failed.";

      setFeedback(message);

      setOperationReceipt({
        tone: "error",
        title:
          "Operation not completed",
        detail: message,
      });
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  async function sendProfileNotice() {
    if (
      !selectedGrantRequest ||
      !profileNoticeEligible ||
      busy ||
      noticeHold ===
        selectedGrantRequest.id ||
      noticeNeedsReconciliation
    ) {
      return;
    }

    const requestId =
      selectedGrantRequest.id;

    const recipientEmail =
      selectedGrantRequest.requesterEmail;

    const previous =
      currentNotice
        ? ` Previous attempt: ${currentNotice.status} at ${currentNotice.attemptedAt}.`
        : " No previous attempt is recorded.";

    if (
      !window.confirm(
        `Send French-Ward Institutional Profile access instructions to ${recipientEmail}?${previous} This creates a separate audited delivery attempt.`,
      )
    ) {
      return;
    }

    const deliveryKey =
      window.crypto.randomUUID();

    setBusy(true);
    setBusyAction("NOTICE");
    setFeedback("");

    setOperationReceipt({
      tone: "working",
      title:
        "Sending Profile access notice…",
      detail:
        `Requesting email-provider acceptance for ${recipientEmail}.`,
    });

    try {
      const response = await fetch(
        "/api/admin/institutional-access/profile-notice",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            requestId,
            deliveryKey,
          }),
        },
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ||
            "Notice request failed.",
        );
      }

      const status =
        result.result?.status;

      if (status === "ACCEPTED") {
        setFeedback("");

        setOperationReceipt({
          tone: "success",
          title:
            "Profile notice accepted",
          detail:
            `${recipientEmail} · The email provider accepted the notice. ` +
            "Inbox delivery is not independently confirmed.",
        });
      } else {
        const outcome =
          String(
            status ?? "UNKNOWN",
          );

        const message =
          `Profile access notice outcome: ${outcome}. ` +
          "Verify the delivery record before sending again.";

        setFeedback(message);

        setOperationReceipt({
          tone:
            status === "FAILED" ||
            status === "BLOCKED"
              ? "error"
              : "working",
          title:
            `Notice outcome · ${outcome}`,
          detail: message,
        });

        if (
          status === "SENDING" ||
          status ===
            "DELIVERY_UNKNOWN" ||
          status === "BLOCKED"
        ) {
          setNoticeHold(requestId);
        }
      }

      router.refresh();
    } catch (error) {
      setNoticeHold(requestId);

      const message =
        (error instanceof Error
          ? error.message
          : "Notice request failed.") +
        " Verify delivery state before resending.";

      setFeedback(message);

      setOperationReceipt({
        tone: "error",
        title:
          "Notice delivery unresolved",
        detail: message,
      });
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  const summaryCards: Array<{
    mode: Mode;
    value: number | string;
    label: string;
    description: string;
  }> = [
    {
      mode: "MANAGE",
      value: currentGrants.length,
      label: "Effective grants",
      description:
        "Review and govern existing recipient access.",
    },
    {
      mode: "DECIDE",
      value: pendingRequests.length,
      label: "Pending decisions",
      description:
        "Requests requiring an operator judgment.",
    },
    {
      mode: "MANAGE",
      value: recipientGroups.length,
      label: "Active recipients",
      description:
        "Named identities with currently effective access.",
    },
    {
      mode: "HISTORY",
      value: historicalGrants.length,
      label: "Closed access",
      description:
        "Revoked, expired and historical records.",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100%",
        color: "#e9edf4",
        fontFamily:
          "system-ui,sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "none",
          margin: 0,
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            margin: 0,
            padding: "8px 28px 10px",
            borderBottom: "1px solid #26384d",
            background: "rgba(8,14,24,0.98)",
            backdropFilter: "blur(12px)",
          }}
        >
          <nav
            aria-label="Administration domains"
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
              flexWrap: "wrap",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <Link
              href="/admin"
              style={{ color: "#7fa9cf", textDecoration: "none" }}
            >
              Admin
            </Link>

            <Link
              href="/admin/incoming"
              style={{ color: "#7fa9cf", textDecoration: "none" }}
            >
              Incoming
            </Link>

            <Link
              href="/admin/control-center"
              style={{ color: "#7fa9cf", textDecoration: "none" }}
            >
              Control Center
            </Link>

            <Link
              href="/admin/representative-program"
              style={{ color: "#7fa9cf", textDecoration: "none" }}
            >
              Representative Program
            </Link>

            <span
              aria-current="page"
              style={{
                color: "#f0f4f8",
                paddingBottom: 3,
                borderBottom: "1px solid #a7c4dd",
              }}
            >
              Institutional Access
            </span>
          </nav>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.16em",
                color: "#7c91a8",
              }}
            >
              FRENCH-WARD / ADMINISTRATION
            </span>

            <strong
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#eef3f8",
              }}
            >
              Institutional Access
            </strong>

            <span
              style={{
                fontSize: 11,
                color: "#8fa3b9",
              }}
            >
              Govern who may enter, what they may access, and why.
            </span>
          </div>
        </div>

        <div style={{ padding: "18px 28px 30px" }}>

        <section
          aria-label="Institutional Access operating modes"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(205px,1fr))",
            gap: 10,
            marginTop: 18,
          }}
        >
          {summaryCards.map(
            (card) => {
              const active =
                mode === card.mode;

              return (
                <button
                  key={card.label}
                  onClick={() =>
                    selectMode(
                      card.mode,
                    )
                  }
                  style={{
                    ...panel,
                    padding: 16,
                    textAlign: "left",
                    color: "#e9edf4",
                    cursor: "pointer",
                    borderColor:
                      active
                        ? "#587493"
                        : "#26384d",
                    background:
                      active
                        ? "#122236"
                        : "#0b1420",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "baseline",
                      gap: 12,
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 24,
                        fontWeight:
                          500,
                      }}
                    >
                      {card.value}
                    </strong>

                    {active && (
                      <span
                        style={{
                          fontSize:
                            9,
                          letterSpacing:
                            "0.13em",
                          color:
                            "#9bd1b2",
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing:
                        "0.07em",
                      marginTop: 7,
                    }}
                  >
                    {card.label}
                  </div>

                  <p
                    style={{
                      ...muted,
                      fontSize: 11,
                      lineHeight: 1.5,
                      margin:
                        "7px 0 0",
                    }}
                  >
                    {
                      card.description
                    }
                  </p>
                </button>
              );
            },
          )}
        </section>

        <nav
          aria-label="Institutional Access mode"
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
            marginTop: 12,
            borderBottom:
              "1px solid #26384d",
          }}
        >
          {[
            ["MANAGE", "Manage Access"],
            ["DECIDE", "Decide Requests"],
            ["HISTORY", "History"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() =>
                selectMode(
                  value as Mode,
                )
              }
              style={{
                padding:
                  "11px 14px",
                color:
                  mode === value
                    ? "#eef4fb"
                    : "#91a4bb",
                background:
                  "transparent",
                border: "none",
                borderBottom:
                  mode === value
                    ? "2px solid #8aa9c8"
                    : "2px solid transparent",
                cursor:
                  "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {operationReceipt && (
          <div
            role="status"
            aria-live="polite"
            style={{
              margin:
                "14px 0 0",
              padding:
                "13px 15px",
              border:
                operationReceipt.tone ===
                "success"
                  ? "1px solid #477564"
                  : operationReceipt.tone ===
                      "error"
                    ? "1px solid #815452"
                    : "1px solid #526b84",
              background:
                operationReceipt.tone ===
                "success"
                  ? "#10251f"
                  : operationReceipt.tone ===
                      "error"
                    ? "#281819"
                    : "#101d2b",
              display:
                "flex",
              gap: 14,
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing:
                    "0.13em",
                  textTransform:
                    "uppercase",
                  color:
                    operationReceipt.tone ===
                    "success"
                      ? "#8dc9ad"
                      : operationReceipt.tone ===
                          "error"
                        ? "#d8a09d"
                        : "#91b6d7",
                  marginBottom:
                    5,
                }}
              >
                {operationReceipt.tone ===
                "working"
                  ? "Operation in progress"
                  : operationReceipt.tone ===
                      "success"
                    ? "Operation complete"
                    : "Operator attention"}
              </div>

              <strong
                style={{
                  display:
                    "block",
                  fontSize: 15,
                  fontWeight: 500,
                  color:
                    "#eef3f8",
                }}
              >
                {operationReceipt.title}
              </strong>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  lineHeight:
                    1.55,
                  color:
                    "#a7b6c7",
                }}
              >
                {operationReceipt.detail}
              </div>
            </div>

            {operationReceipt.tone !==
              "working" && (
              <button
                type="button"
                onClick={() =>
                  setOperationReceipt(
                    null,
                  )
                }
                aria-label="Dismiss operation receipt"
                style={{
                  background:
                    "transparent",
                  border: 0,
                  color:
                    "#8295aa",
                  cursor:
                    "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 3,
                }}
              >
                ×
              </button>
            )}
          </div>
        )}

        {mode === "MANAGE" && (
          <section
            style={{
              marginTop: 22,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px,0.65fr) minmax(340px,1.35fr) minmax(260px,0.8fr)",
                gap: 14,
                alignItems:
                  "start",
              }}
            >
              <aside
                style={{
                  ...panel,
                  padding: 14,
                }}
              >
                <p
                  style={{
                    ...stateLabel(
                      "CURRENT",
                    ),
                    margin:
                      "0 0 5px",
                  }}
                >
                  RECIPIENTS
                </p>

                <h2
                  style={{
                    margin:
                      "0 0 14px",
                    fontSize: 16,
                    fontWeight: 500,
                  }}
                >
                  Effective access
                </h2>

                <div
                  style={{
                    display: "grid",
                    gap: 7,
                  }}
                >
                  {recipientGroups.map(
                    (recipient) => {
                      const active =
                        recipient.key ===
                        selectedRecipient?.key;

                      return (
                        <button
                          key={
                            recipient.key
                          }
                          onClick={() =>
                            selectRecipient(
                              recipient.key,
                            )
                          }
                          style={{
                            ...inset,
                            padding: 11,
                            textAlign:
                              "left",
                            color:
                              "#eef3f9",
                            cursor:
                              "pointer",
                            background:
                              active
                                ? "#192e45"
                                : "#0d1725",
                          }}
                        >
                          <strong
                            style={{
                              fontSize:
                                13,
                            }}
                          >
                            {
                              recipient.name
                            }
                          </strong>

                          <div
                            style={{
                              fontSize:
                                11,
                              color:
                                "#aabbd0",
                              marginTop:
                                3,
                              overflowWrap:
                                "anywhere",
                            }}
                          >
                            {
                              recipient.email
                            }
                          </div>

                          <div
                            style={{
                              fontSize:
                                10,
                              color:
                                "#8298b1",
                              marginTop:
                                4,
                            }}
                          >
                            {
                              recipient
                                .grants
                                .length
                            }{" "}
                            effective
                            permission
                            {recipient
                              .grants
                              .length ===
                            1
                              ? ""
                              : "s"}
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </aside>

              <section
                style={{
                  ...panel,
                  padding: 18,
                  minWidth: 0,
                }}
              >
                {selectedRecipient ? (
                  <>
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: 15,
                        flexWrap:
                          "wrap",
                        alignItems:
                          "flex-start",
                        paddingBottom:
                          15,
                        borderBottom:
                          "1px solid #26384d",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            ...stateLabel(
                              "CURRENT",
                            ),
                            margin: 0,
                          }}
                        >
                          CURRENT
                          RECIPIENT
                        </p>

                        <h2
                          style={{
                            margin:
                              "6px 0 4px",
                            fontSize:
                              23,
                            fontWeight:
                              500,
                          }}
                        >
                          {
                            selectedRecipient.name
                          }
                        </h2>

                        <div
                          style={{
                            color:
                              "#b8c7d7",
                            fontSize:
                              12,
                          }}
                        >
                          {
                            selectedRecipient.email
                          }
                          {" · "}
                          {
                            selectedRecipient.affiliation
                          }
                        </div>
                      </div>

                      <div
                        style={{
                          ...stateLabel(
                            "CURRENT",
                          ),
                        }}
                      >
                        {
                          selectedRecipient
                            .grants
                            .length
                        }{" "}
                        EFFECTIVE
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gap: 7,
                        marginTop: 14,
                      }}
                    >
                      {selectedRecipient.grants.map(
                        (grant) => {
                          const active =
                            grant.id ===
                            selectedGrant?.id;

                          return (
                            <button
                              key={
                                grant.id
                              }
                              onClick={() =>
                                selectGrant(
                                  grant.id,
                                )
                              }
                              style={{
                                display:
                                  "grid",
                                gridTemplateColumns:
                                  "minmax(0,1fr) auto",
                                alignItems:
                                  "center",
                                gap: 12,
                                padding:
                                  "13px 12px",
                                textAlign:
                                  "left",
                                color:
                                  "#edf2f7",
                                border:
                                  "1px solid #2c4055",
                                background:
                                  active
                                    ? "#17283b"
                                    : "#0d1725",
                                cursor:
                                  "pointer",
                              }}
                            >
                              <div
                                style={{
                                  minWidth:
                                    0,
                                }}
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",
                                    gap: 8,
                                    flexWrap:
                                      "wrap",
                                    alignItems:
                                      "center",
                                  }}
                                >
                                  <strong
                                    style={{
                                      fontSize:
                                        12,
                                    }}
                                  >
                                    {scopeLabel(
                                      grant.scope,
                                    )}
                                  </strong>

                                  <span
                                    style={{
                                      border:
                                        "1px solid #40566d",
                                      padding:
                                        "2px 6px",
                                      fontSize:
                                        9,
                                      color:
                                        "#aec1d5",
                                    }}
                                  >
                                    {
                                      grant
                                        .provenance
                                        .label
                                    }
                                  </span>
                                </div>

                                <div
                                  style={{
                                    fontSize:
                                      11,
                                    marginTop:
                                      5,
                                    color:
                                      "#aebed0",
                                    overflowWrap:
                                      "anywhere",
                                  }}
                                >
                                  {
                                    grant.resourceReference
                                  }{" "}
                                  · v
                                  {
                                    grant.resourceVersion
                                  }
                                </div>
                              </div>

                              <span
                                style={{
                                  fontSize:
                                    18,
                                  color:
                                    active
                                      ? "#dce8f5"
                                      : "#70869e",
                                }}
                              >
                                ›
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </>
                ) : (
                  <p
                    style={muted}
                  >
                    No current
                    recipient access.
                  </p>
                )}
              </section>

              <aside
                style={{
                  ...panel,
                  padding: 17,
                  position:
                    "sticky",
                  top: 12,
                }}
              >
                <p
                  style={{
                    ...stateLabel(
                      selectedGrant
                        ? "CURRENT"
                        : "",
                    ),
                    margin: 0,
                  }}
                >
                  ACCESS ACTION
                </p>

                {selectedGrant ? (
                  <>
                    <h2
                      style={{
                        fontSize:
                          18,
                        fontWeight:
                          500,
                        margin:
                          "7px 0 14px",
                      }}
                    >
                      {scopeLabel(
                        selectedGrant.scope,
                      )}
                    </h2>

                    <dl
                      style={{
                        display:
                          "grid",
                        gap: 11,
                        margin: 0,
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <dt
                          style={
                            muted
                          }
                        >
                          Resource
                        </dt>
                        <dd
                          style={{
                            margin:
                              "3px 0 0",
                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {
                            selectedGrant.resourceReference
                          }{" "}
                          · v
                          {
                            selectedGrant.resourceVersion
                          }
                        </dd>
                      </div>

                      <div>
                        <dt
                          style={
                            muted
                          }
                        >
                          Origin
                        </dt>
                        <dd
                          style={{
                            margin:
                              "3px 0 0",
                          }}
                        >
                          {
                            selectedGrant
                              .provenance
                              .label
                          }
                        </dd>
                      </div>

                      {selectedGrant
                        .provenance
                        .dossierId && (
                        <div>
                          <dt
                            style={
                              muted
                            }
                          >
                            Dossier
                          </dt>
                          <dd
                            style={{
                              margin:
                                "3px 0 0",
                              overflowWrap:
                                "anywhere",
                            }}
                          >
                            {
                              selectedGrant
                                .provenance
                                .dossierId
                            }
                          </dd>
                        </div>
                      )}

                      <div>
                        <dt
                          style={
                            muted
                          }
                        >
                          Expires
                        </dt>
                        <dd
                          style={{
                            margin:
                              "3px 0 0",
                          }}
                        >
                          {shortDate(
                            selectedGrant.expiresAt,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt
                          style={
                            muted
                          }
                        >
                          First access
                        </dt>
                        <dd
                          style={{
                            margin:
                              "3px 0 0",
                          }}
                        >
                          {shortDate(
                            selectedGrant.firstAccessAt,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt
                          style={
                            muted
                          }
                        >
                          Last access
                        </dt>
                        <dd
                          style={{
                            margin:
                              "3px 0 0",
                          }}
                        >
                          {shortDate(
                            selectedGrant.lastAccessAt,
                          )}
                        </dd>
                      </div>
                    </dl>

                    {selectedGrantRequest && (
                      <button
                        style={{
                          ...subtleButton,
                          width: "100%",
                          marginTop:
                            16,
                        }}
                        onClick={() => {
                          selectRequest(
                            selectedGrantRequest.id,
                          );
                          selectMode(
                            "HISTORY",
                          );
                        }}
                      >
                        View request &
                        event history
                      </button>
                    )}

                    {selectedGrant.scope ===
                      "PROFILE_VIEW" && (
                      <div
                        style={{
                          borderTop:
                            "1px solid #2b3e52",
                          marginTop:
                            17,
                          paddingTop:
                            15,
                        }}
                      >
                        <h3
                          style={{
                            fontSize:
                              13,
                            margin:
                              "0 0 8px",
                          }}
                        >
                          Profile access
                          notice
                        </h3>

                        <p
                          style={{
                            ...muted,
                            fontSize:
                              11,
                            lineHeight:
                              1.5,
                          }}
                        >
                          {currentNotice
                            ? `Latest: ${currentNotice.status} · ${shortDate(
                                currentNotice.attemptedAt,
                              )}`
                            : "No Profile access notice recorded."}
                        </p>

                        {profileNoticeEligible &&
                        currentNotice?.status ===
                          "ACCEPTED" ? (
                          <div
                            style={{
                              marginTop:
                                10,
                              padding:
                                10,
                              border:
                                "1px solid #3f6658",
                              background:
                                "#10231e",
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  10,
                                letterSpacing:
                                  "0.11em",
                                color:
                                  "#8dc9ad",
                                marginBottom:
                                  7,
                              }}
                            >
                              NOTICE SENT ·
                              ACCEPTED
                            </div>

                            <p
                              style={{
                                ...muted,
                                margin:
                                  "0 0 9px",
                                fontSize:
                                  11,
                                lineHeight:
                                  1.5,
                              }}
                            >
                              Provider
                              acceptance is
                              recorded. Inbox
                              delivery is not
                              independently
                              confirmed.
                            </p>

                            <button
                              style={{
                                ...subtleButton,
                                width:
                                  "100%",
                                fontSize:
                                  11,
                                opacity:
                                  0.78,
                              }}
                              disabled={
                                busy ||
                                noticeNeedsReconciliation ||
                                noticeHold ===
                                  selectedGrantRequest?.id
                              }
                              onClick={
                                sendProfileNotice
                              }
                            >
                              {busyAction ===
                              "NOTICE"
                                ? "Sending notice…"
                                : "Resend notice"}
                            </button>
                          </div>
                        ) : profileNoticeEligible ? (
                          <button
                            style={{
                              ...subtleButton,
                              width:
                                "100%",
                            }}
                            disabled={
                              busy ||
                              noticeNeedsReconciliation ||
                              noticeHold ===
                                selectedGrantRequest?.id
                            }
                            onClick={
                              sendProfileNotice
                            }
                          >
                            {busyAction ===
                            "NOTICE"
                              ? "Sending notice…"
                              : "Send access notice"}
                          </button>
                        ) : null
                        }
                      </div>
                    )}

                    <div
                      style={{
                        borderTop:
                          "1px solid #2b3e52",
                        marginTop:
                          17,
                        paddingTop:
                          15,
                      }}
                    >
                      <h3
                        style={{
                          fontSize:
                            13,
                          margin:
                            "0 0 8px",
                        }}
                      >
                        Revoke this
                        access
                      </h3>

                      <p
                        style={{
                          ...muted,
                          fontSize:
                            11,
                          lineHeight:
                            1.5,
                        }}
                      >
                        Revokes only
                        this permission.
                        Dossier
                        revocation is a
                        separate
                        higher-level
                        operation.
                      </p>

                      <textarea
                        style={{
                          ...field,
                          minHeight:
                            78,
                        }}
                        value={
                          revokeReason
                        }
                        onChange={(
                          event,
                        ) =>
                          setRevokeReason(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Revocation reason required."
                        maxLength={
                          3000
                        }
                      />

                      <button
                        style={{
                          ...dangerButton,
                          width: "100%",
                          marginTop:
                            9,
                        }}
                        disabled={
                          busy ||
                          !revokeReason.trim()
                        }
                        onClick={() =>
                          mutate(
                            "REVOKE",
                            selectedGrant.id,
                          )
                        }
                      >
                        Revoke selected
                        access
                      </button>
                    </div>
                  </>
                ) : (
                  <p
                    style={{
                      ...muted,
                      fontSize: 12,
                    }}
                  >
                    Select a recipient
                    and resource.
                  </p>
                )}
              </aside>
            </div>
          </section>
        )}

        {mode === "DECIDE" && (
          <section
            style={{
              marginTop: 22,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(230px,0.6fr) minmax(360px,1.3fr) minmax(260px,0.75fr)",
                gap: 14,
                alignItems:
                  "start",
              }}
            >
              <aside
                style={{
                  ...panel,
                  padding: 14,
                }}
              >
                <p
                  style={{
                    ...stateLabel(
                      "PENDING",
                    ),
                    margin: 0,
                  }}
                >
                  DECISION QUEUE
                </p>

                <h2
                  style={{
                    fontSize: 16,
                    fontWeight:
                      500,
                    margin:
                      "6px 0 14px",
                  }}
                >
                  Pending requests (
                  {
                    pendingRequests.length
                  }
                  )
                </h2>

                <div
                  style={{
                    display: "grid",
                    gap: 7,
                  }}
                >
                  {pendingRequests.map(
                    (request) => (
                      <button
                        key={
                          request.id
                        }
                        onClick={() =>
                          selectRequest(
                            request.id,
                          )
                        }
                        style={{
                          ...inset,
                          padding:
                            11,
                          textAlign:
                            "left",
                          color:
                            "#eef3f9",
                          cursor:
                            "pointer",
                          background:
                            request.id ===
                            selectedRequest?.id
                              ? "#192e45"
                              : "#0d1725",
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              13,
                          }}
                        >
                          {
                            request.requesterName
                          }
                        </strong>

                        <div
                          style={{
                            marginTop:
                              4,
                            fontSize:
                              10,
                            color:
                              "#aabbd0",
                          }}
                        >
                          {scopeLabel(
                            request.scope,
                          )}
                        </div>
                      </button>
                    ),
                  )}

                  {pendingRequests.length ===
                    0 && (
                    <p
                      style={{
                        ...muted,
                        fontSize:
                          12,
                      }}
                    >
                      No requests
                      require a
                      decision.
                    </p>
                  )}
                </div>
              </aside>

              <section
                style={{
                  ...panel,
                  padding: 20,
                  minWidth: 0,
                }}
              >
                {selectedRequest &&
                selectedRequest.status ===
                  "PENDING" ? (
                  <>
                    <p
                      style={{
                        ...stateLabel(
                          "PENDING",
                        ),
                        margin: 0,
                      }}
                    >
                      PENDING /{" "}
                      {
                        selectedRequest.scope
                      }
                    </p>

                    <h2
                      style={{
                        fontSize:
                          23,
                        fontWeight:
                          500,
                        margin:
                          "7px 0 16px",
                      }}
                    >
                      {
                        selectedRequest.requesterName
                      }
                    </h2>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(170px,1fr))",
                        gap: 14,
                        fontSize:
                          12,
                      }}
                    >
                      <div>
                        <strong>
                          Email
                        </strong>
                        <p>
                          {
                            selectedRequest.requesterEmail
                          }
                        </p>
                      </div>

                      <div>
                        <strong>
                          Affiliation
                        </strong>
                        <p>
                          {
                            selectedRequest.institutionalAffiliation
                          }
                        </p>
                      </div>

                      <div>
                        <strong>
                          Capacity
                        </strong>
                        <p>
                          {
                            selectedRequest.requesterCapacity
                          }
                        </p>
                      </div>

                      <div>
                        <strong>
                          Resource
                        </strong>
                        <p
                          style={{
                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {
                            selectedRequest.resourceReference
                          }{" "}
                          · v
                          {
                            selectedRequest.resourceVersion
                          }
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop:
                          "1px solid #26384d",
                        marginTop:
                          12,
                        paddingTop:
                          16,
                      }}
                    >
                      <strong
                        style={{
                          fontSize:
                            12,
                        }}
                      >
                        Stated purpose
                      </strong>

                      <p
                        style={{
                          color:
                            "#bccadc",
                          lineHeight:
                            1.6,
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          selectedRequest.purpose
                        }
                      </p>
                    </div>

                    <h3
                      style={{
                        fontSize:
                          13,
                        marginTop:
                          24,
                      }}
                    >
                      Event history
                    </h3>

                    <ul
                      style={{
                        paddingLeft:
                          18,
                      }}
                    >
                      {selectedRequest.events.map(
                        (event) => (
                          <li
                            key={
                              event.id
                            }
                            style={{
                              fontSize:
                                11,
                              color:
                                "#aebdce",
                              marginBottom:
                                6,
                            }}
                          >
                            {
                              event.type
                            }{" "}
                            ·{" "}
                            {shortDate(
                              event.occurredAt,
                            )}
                            {event.reason
                              ? ` — ${event.reason}`
                              : ""}
                          </li>
                        ),
                      )}
                    </ul>
                  </>
                ) : (
                  <p
                    style={muted}
                  >
                    Select a pending
                    request.
                  </p>
                )}
              </section>

              <aside
                style={{
                  ...panel,
                  padding: 17,
                  position:
                    "sticky",
                  top: 12,
                }}
              >
                <p
                  style={{
                    ...stateLabel(
                      "PENDING",
                    ),
                    margin: 0,
                  }}
                >
                  OPERATOR DECISION
                </p>

                {selectedRequest &&
                selectedRequest.status ===
                  "PENDING" ? (
                  <>
                    <h2
                      style={{
                        fontSize:
                          18,
                        fontWeight:
                          500,
                        margin:
                          "7px 0 14px",
                      }}
                    >
                      Decide access
                    </h2>

                    {!selectedRequest.isCurrentResource && (
                      <div
                        style={{
                          border: "1px solid #765154",
                          background: "#26191b",
                          padding: 11,
                          marginBottom: 12,
                          fontSize: 11,
                          lineHeight: 1.55,
                          color: "#e5c1c1",
                        }}
                      >
                        Superseded resource request. Requested v
                        {selectedRequest.resourceVersion}; current edition is v
                        {selectedRequest.currentResourceVersion}. Approval is
                        disabled.
                      </div>
                    )}

                    <div
                      style={{
                        ...inset,
                        padding: 11,
                        fontSize:
                          11,
                        lineHeight:
                          1.65,
                        color:
                          "#b8c6d8",
                      }}
                    >
                      <div>
                        Identity:{" "}
                        <strong>
                          {selectedRequest.recipientUserId
                            ? "matched"
                            : "may be provisioned"}
                        </strong>
                      </div>

                      <div>
                        Scope:{" "}
                        <strong>
                          {scopeLabel(
                            selectedRequest.scope,
                          )}
                        </strong>
                      </div>

                      <div>
                        Reason:{" "}
                        <strong>
                          required
                        </strong>
                      </div>

                      <div>
                        Expiration:{" "}
                        <strong>
                          required for
                          approval
                        </strong>
                      </div>
                    </div>

                    <label
                      style={{
                        display:
                          "block",
                        marginTop:
                          14,
                        fontSize:
                          12,
                      }}
                    >
                      Decision reason
                      <textarea
                        style={{
                          ...field,
                          minHeight:
                            95,
                          marginTop:
                            6,
                        }}
                        value={
                          reason
                        }
                        onChange={(
                          event,
                        ) =>
                          setReason(
                            event
                              .target
                              .value,
                          )
                        }
                        maxLength={
                          3000
                        }
                      />
                    </label>

                    <label
                      style={{
                        display:
                          "block",
                        marginTop:
                          12,
                        fontSize:
                          12,
                      }}
                    >
                      Approval expiration
                      <input
                        type="datetime-local"
                        style={{
                          ...field,
                          marginTop:
                            6,
                        }}
                        value={
                          expires
                        }
                        onChange={(
                          event,
                        ) =>
                          setExpires(
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    </label>

                    <button
                      style={{
                        ...button,
                        width: "100%",
                        marginTop:
                          12,
                      }}
                      disabled={
                        busy ||
                        !selectedRequest.isCurrentResource ||
                        !reason.trim() ||
                        !expires
                      }
                      onClick={() =>
                        mutate(
                          "APPROVED",
                          selectedRequest.id,
                        )
                      }
                    >
                      {busyAction ===
                      "APPROVED"
                        ? "Approving access…"
                        : "Approve access"}
                    </button>

                    <button
                      style={{
                        ...subtleButton,
                        width: "100%",
                        marginTop:
                          7,
                      }}
                      disabled={
                        busy ||
                        !reason.trim()
                      }
                      onClick={() =>
                        mutate(
                          "DECLINED",
                          selectedRequest.id,
                        )
                      }
                    >
                      {busyAction ===
                      "DECLINED"
                        ? "Declining request…"
                        : "Decline request"}
                    </button>
                  </>
                ) : (
                  <p
                    style={{
                      ...muted,
                      fontSize: 12,
                    }}
                  >
                    Select a request to
                    act.
                  </p>
                )}
              </aside>
            </div>
          </section>
        )}

        {mode === "HISTORY" && (
          <section
            style={{
              marginTop: 22,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(260px,0.75fr) minmax(0,1.5fr)",
                gap: 14,
                alignItems:
                  "start",
              }}
            >
              <aside
                style={{
                  ...panel,
                  padding: 14,
                }}
              >
                <p
                  style={{
                    ...stateLabel(
                      "REVOKED",
                    ),
                    margin: 0,
                  }}
                >
                  HISTORICAL RECORD
                </p>

                <h2
                  style={{
                    fontSize: 16,
                    fontWeight:
                      500,
                    margin:
                      "6px 0 14px",
                  }}
                >
                  Requests (
                  {
                    historicalRequests.length
                  }
                  )
                </h2>

                <div
                  style={{
                    display: "grid",
                    gap: 6,
                    maxHeight: 620,
                    overflow: "auto",
                  }}
                >
                  {historicalRequests.map(
                    (request) => (
                      <button
                        key={
                          request.id
                        }
                        onClick={() =>
                          selectRequest(
                            request.id,
                          )
                        }
                        style={{
                          ...inset,
                          padding:
                            10,
                          textAlign:
                            "left",
                          color:
                            "#e5edf6",
                          cursor:
                            "pointer",
                          background:
                            request.id ===
                            selectedRequest?.id
                              ? "#192e45"
                              : "#0d1725",
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              12,
                          }}
                        >
                          {
                            request.requesterName
                          }
                        </strong>

                        <div
                          style={{
                            fontSize:
                              10,
                            marginTop:
                              3,
                            color:
                              stateColor(
                                request.status,
                              ),
                          }}
                        >
                          {
                            request.status
                          }{" "}
                          ·{" "}
                          {scopeLabel(
                            request.scope,
                          )}
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </aside>

              <section
                style={{
                  display: "grid",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    ...panel,
                    padding: 19,
                  }}
                >
                  {selectedRequest &&
                  selectedRequest.status !==
                    "PENDING" ? (
                    <>
                      <p
                        style={{
                          ...stateLabel(
                            selectedRequest.status,
                          ),
                          margin: 0,
                        }}
                      >
                        {
                          selectedRequest.status
                        }{" "}
                        /{" "}
                        {
                          selectedRequest.scope
                        }
                      </p>

                      <h2
                        style={{
                          fontSize:
                            21,
                          fontWeight:
                            500,
                          margin:
                            "7px 0 14px",
                        }}
                      >
                        {
                          selectedRequest.requesterName
                        }
                      </h2>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(180px,1fr))",
                          gap: 12,
                          fontSize:
                            12,
                        }}
                      >
                        <div>
                          <strong>
                            Email
                          </strong>
                          <p>
                            {
                              selectedRequest.requesterEmail
                            }
                          </p>
                        </div>

                        <div>
                          <strong>
                            Resource
                          </strong>
                          <p
                            style={{
                              overflowWrap:
                                "anywhere",
                            }}
                          >
                            {
                              selectedRequest.resourceReference
                            }{" "}
                            · v
                            {
                              selectedRequest.resourceVersion
                            }
                          </p>
                        </div>

                        <div>
                          <strong>
                            Policy
                          </strong>
                          <p>
                            {selectedRequest.decisionPolicy ??
                              "—"}
                          </p>
                        </div>

                        <div>
                          <strong>
                            Decided
                          </strong>
                          <p>
                            {shortDate(
                              selectedRequest.decidedAt,
                            )}
                          </p>
                        </div>
                      </div>

                      <p
                        style={{
                          color:
                            "#bccadc",
                          lineHeight:
                            1.6,
                        }}
                      >
                        {
                          selectedRequest.purpose
                        }
                      </p>

                      {selectedRequest.decisionReason && (
                        <p
                          style={{
                            fontSize:
                              12,
                          }}
                        >
                          <strong>
                            Decision
                            reason:
                          </strong>{" "}
                          {
                            selectedRequest.decisionReason
                          }
                        </p>
                      )}

                      <h3
                        style={{
                          fontSize:
                            13,
                          marginTop:
                            20,
                        }}
                      >
                        Event history
                      </h3>

                      <ul
                        style={{
                          paddingLeft:
                            18,
                        }}
                      >
                        {selectedRequest.events.map(
                          (event) => (
                            <li
                              key={
                                event.id
                              }
                              style={{
                                fontSize:
                                  11,
                                marginBottom:
                                  6,
                                color:
                                  "#aebdce",
                              }}
                            >
                              {
                                event.type
                              }{" "}
                              ·{" "}
                              {shortDate(
                                event.occurredAt,
                              )}
                              {event.reason
                                ? ` — ${event.reason}`
                                : ""}
                            </li>
                          ),
                        )}
                      </ul>
                    </>
                  ) : (
                    <p
                      style={
                        muted
                      }
                    >
                      Select a
                      historical request.
                    </p>
                  )}
                </div>

                <details
                  style={{
                    ...panel,
                    padding: 16,
                  }}
                >
                  <summary
                    style={{
                      cursor:
                        "pointer",
                      fontSize:
                        12,
                      letterSpacing:
                        "0.07em",
                    }}
                  >
                    CLOSED ACCESS GRANTS (
                    {
                      historicalGrants.length
                    }
                    )
                  </summary>

                  <div
                    style={{
                      display: "grid",
                      gap: 0,
                      marginTop:
                        12,
                    }}
                  >
                    {historicalGrants.map(
                      (grant) => (
                        <div
                          key={
                            grant.id
                          }
                          style={{
                            padding:
                              "10px 0",
                            borderTop:
                              "1px solid #25364a",
                            fontSize:
                              11,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              gap: 12,
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <strong>
                              {
                                grant.recipientEmail
                              }
                            </strong>

                            <span
                              style={stateLabel(
                                grant.state,
                              )}
                            >
                              {
                                grant.state
                              }
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop:
                                4,
                              color:
                                "#91a4bb",
                              overflowWrap:
                                "anywhere",
                            }}
                          >
                            {scopeLabel(
                              grant.scope,
                            )}{" "}
                            ·{" "}
                            {
                              grant.resourceReference
                            }{" "}
                            v
                            {
                              grant.resourceVersion
                            }{" "}
                            ·{" "}
                            {
                              grant
                                .provenance
                                .label
                            }
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </details>

                <div
                  style={{
                    ...panel,
                    padding: 16,
                  }}
                >
                  <p
                    style={{
                      ...stateLabel(
                        "SCHEDULED",
                      ),
                      margin: 0,
                    }}
                  >
                    TEST / VERIFICATION
                  </p>

                  <p
                    style={{
                      ...muted,
                      fontSize: 11,
                      lineHeight: 1.6,
                      marginBottom: 0,
                    }}
                  >
                    Verification records
                    are not inferred from
                    names or free-text
                    purposes. A durable
                    explicit provenance
                    marker will be added
                    separately before
                    records are moved
                    into this lane.
                  </p>
                </div>
              </section>
            </div>
          </section>
        )}

        </div>

      </div>
    </main>
  );
}
