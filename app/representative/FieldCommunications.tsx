"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import styles from "./field-communications.module.css";

type FieldContext =
  | {
      type: "WORKSPACE";
    }
  | {
      type: "APPOINTMENT";
      id: string;
    }
  | {
      type: "CUP_RESOURCE";
      id: string;
    };

type FieldMessage = {
  id: string;
  kind: string;
  body: string;
  createdAt: string;
  sender: {
    role: "REPRESENTATIVE" | "FRENCH_WARD";
    displayName: string;
  };
  context: {
    targetType: string;
    targetSubtype: string;
    targetId: string;
  } | null;
};

type FieldState = {
  participant: {
    id: string;
    docketReference: string;
    displayName: string;
  };
  room: {
    id: string;
    conversationId: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  messages: FieldMessage[];
};

type MessageType = "COMMENT" | "REQUEST" | "RESOURCE_COMMENT";

type FieldCommunicationsProps = {
  previewMode?: boolean;
  previewParticipant?: {
    docketReference: string;
    displayName: string;
  };
};

function formatDate(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return (
    new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(date) + " UTC"
  );
}

function readContextFromLocation(): FieldContext {
  if (typeof window === "undefined") {
    return {
      type: "WORKSPACE",
    };
  }

  const params = new URLSearchParams(window.location.search);

  const type = params.get("fieldContextType");

  const id = params.get("fieldContextId")?.trim();

  if (type === "APPOINTMENT" && id) {
    return {
      type: "APPOINTMENT",
      id,
    };
  }

  if (type === "CUP_RESOURCE" && id) {
    return {
      type: "CUP_RESOURCE",
      id,
    };
  }

  return {
    type: "WORKSPACE",
  };
}

function contextLabel(context: FieldContext) {
  switch (context.type) {
    case "APPOINTMENT":
      return "Your Appointment";

    case "CUP_RESOURCE":
      return "Selected Field Resource";

    default:
      return "Representative Workspace";
  }
}

export default function FieldCommunications({
  previewMode = false,
  previewParticipant,
}: FieldCommunicationsProps = {}) {
  const [field, setField] = useState<FieldState | null>(() =>
    previewMode && previewParticipant
      ? {
          participant: {
            id: "preview-participant",
            docketReference: previewParticipant.docketReference,
            displayName: previewParticipant.displayName,
          },
          room: null,
          messages: [],
        }
      : null,
  );

  const [loading, setLoading] = useState(!previewMode);

  const [error, setError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);

  const [body, setBody] = useState("");

  const [messageType, setMessageType] = useState<MessageType>("COMMENT");

  const [context, setContext] = useState<FieldContext>({
    type: "WORKSPACE",
  });

  const effectiveMessageType = useMemo<MessageType>(
    () => (context.type === "CUP_RESOURCE" ? "RESOURCE_COMMENT" : messageType),
    [context, messageType],
  );

  async function load() {
    setLoading(true);

    setError(null);

    try {
      const response = await fetch("/api/representative/communications", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const payload = await response.json();

      if (!response.ok || payload?.ok !== true) {
        throw new Error("FIELD_COMMUNICATIONS_UNAVAILABLE");
      }

      setField(payload.field);
    } catch {
      setError("Field communications are temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setContext(readContextFromLocation());

    if (previewMode) {
      setLoading(false);
      return;
    }

    void load();
  }, [previewMode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (previewMode) {
      return;
    }

    const trimmed = body.trim();

    if (!trimmed || sending) {
      return;
    }

    setSending(true);

    setError(null);

    try {
      const clientMessageId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `arp-field-${Date.now()}`;

      const response = await fetch("/api/representative/communications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          clientMessageId,
          type: effectiveMessageType,
          body: trimmed,
          context,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload?.ok !== true) {
        throw new Error("FIELD_COMMUNICATION_SEND_FAILED");
      }

      setBody("");

      await load();
    } catch {
      setError("Your communication could not be submitted. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function clearContext() {
    setContext({
      type: "WORKSPACE",
    });

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);

      url.searchParams.delete("fieldContextType");

      url.searchParams.delete("fieldContextId");

      window.history.replaceState(
        {},
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  }

  return (
    <section
      id="field-communications"
      aria-labelledby="field-communications-title"
      className={styles.surface}
    >
      {previewMode ? (
        <div className={styles.previewNotice} role="status">
          <strong>Admin Preview</strong>
          <span>
            Representative actions are disabled. No communication will be
            created or submitted from this preview.
          </span>
        </div>
      ) : null}

      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Representative Field</p>

          <h1 id="field-communications-title" className={styles.title}>
            Field Communications
          </h1>

          <p className={styles.intro}>
            Use this channel for representative comments, questions, resource
            observations, and requests that should remain connected to your
            French-Ward Program record.
          </p>
        </div>

        {field ? (
          <div className={styles.record}>
            <span>Program record</span>

            <strong>{field.participant.docketReference}</strong>
          </div>
        ) : null}
      </header>

      <div className={styles.doctrine}>
        <strong>Communication does not create authority.</strong>

        <span>
          Appointment, delegated authority, resource permissions, and
          transaction authority remain separately governed.
        </span>
      </div>

      <div className={styles.contextBar}>
        <div>
          <span className={styles.contextLabel}>Field context</span>

          <strong>{contextLabel(context)}</strong>
        </div>

        {context.type !== "WORKSPACE" ? (
          <button
            type="button"
            className={styles.contextClear}
            onClick={clearContext}
          >
            Return to general field
          </button>
        ) : null}
      </div>

      <div className={styles.thread} aria-live="polite">
        {loading ? (
          <p className={styles.quiet}>Loading field record…</p>
        ) : field && field.messages.length > 0 ? (
          field.messages.map((message) => (
            <article
              key={message.id}
              className={
                message.sender.role === "REPRESENTATIVE"
                  ? styles.messageRepresentative
                  : styles.messageInstitution
              }
            >
              <header className={styles.messageHeader}>
                <strong>{message.sender.displayName}</strong>

                <span>{formatDate(message.createdAt)}</span>
              </header>

              <p className={styles.messageBody}>{message.body}</p>

              {message.context ? (
                <p className={styles.messageContext}>
                  Context · {message.context.targetSubtype}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            <p>No field record has been opened yet.</p>

            <span>
              The first submission establishes the representative
              field thread.
            </span>
          </div>
        )}
      </div>

      <form className={styles.composer} onSubmit={submit}>
        <div className={styles.composerHead}>
          <div>
            <p className={styles.kicker}>Field Record Entry</p>

            <h2>Record communication</h2>
          </div>

          {context.type === "CUP_RESOURCE" ? (
            <span className={styles.resourceContext}>Resource Comment</span>
          ) : (
            <label className={styles.typeControl}>
              <span>Type</span>

              <select
                value={messageType}
                disabled={previewMode}
                onChange={(event) =>
                  setMessageType(event.target.value as MessageType)
                }
              >
                <option value="COMMENT">Comment</option>

                <option value="REQUEST">Question / Request</option>
              </select>
            </label>
          )}
        </div>

        <label className={styles.messageControl}>
          <span>Message</span>

          <textarea
            value={body}
            disabled={previewMode}
            onChange={(event) => setBody(event.target.value)}
            maxLength={10000}
            rows={7}
            placeholder={
              context.type === "CUP_RESOURCE"
                ? "Record a question, observation, or comment about this resource."
                : "Record a comment, question, observation, or request."
            }
          />
        </label>

        <div className={styles.submitRow}>
          <p>
            This submission becomes part of your representative communication
            record.
          </p>

          <button
            type="submit"
            disabled={previewMode || sending || !body.trim()}
          >
            {previewMode
              ? "Submission Disabled · Preview"
              : sending
                ? "Submitting…"
                : "Submit to French-Ward"}
          </button>
        </div>

        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
