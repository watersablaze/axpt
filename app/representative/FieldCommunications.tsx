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

type FieldInstitutionalReflection = {
  id: string;
  operationalRoomId: string;
  sourceSystem: string;
  sourceEventId: string;
  sourceAggregateType: string;
  sourceAggregateId: string;
  sourceEventType: string;
  sourceOccurredAt: string;
  targetType: string;
  targetSubtype: string;
  targetId: string;
  reflectionType: string;
  reflectionCode: string;
  createdAt: string;
};

type FieldTimelineItem =
  | {
      itemType: "MESSAGE";
      id: string;
      occurredAt: string;
      message: FieldMessage;
    }
  | {
      itemType: "INSTITUTIONAL_REFLECTION";
      id: string;
      occurredAt: string;
      reflection: FieldInstitutionalReflection;
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
  attention: {
    unreadCount: number;
    lastReadMessageId: string | null;
    lastReadAt: string | null;
  };
  timeline?: {
    conversationId: string;
    messageCount: number;
    reflectionCount: number;
    items: FieldTimelineItem[];
  };
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

function institutionalLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) => character.toUpperCase(),
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
          attention: {
            unreadCount: 0,
            lastReadMessageId: null,
            lastReadAt: null,
          },
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

      const nextField =
        payload.field as FieldState;

      setField(nextField);

      const newestMessage =
        nextField.timeline
          ? [...nextField.timeline.items]
              .reverse()
              .find(
                (
                  item,
                ): item is Extract<
                  FieldTimelineItem,
                  { itemType: "MESSAGE" }
                > =>
                  item.itemType ===
                  "MESSAGE",
              )
          : undefined;

      if (
        nextField.attention.unreadCount > 0 &&
        newestMessage
      ) {
        try {
          const readResponse =
            await fetch(
              "/api/representative/communications/read",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  Accept:
                    "application/json",
                },
                body:
                  JSON.stringify({
                    throughMessageId:
                      newestMessage.message.id,
                  }),
              },
            );

          const readPayload =
            await readResponse.json();

          if (
            readResponse.ok &&
            readPayload?.ok === true &&
            readPayload?.read
          ) {
            setField(
              (current) =>
                current
                  ? {
                      ...current,
                      attention: {
                        unreadCount: 0,
                        lastReadMessageId:
                          readPayload.read
                            .lastReadMessageId ??
                          current.attention
                            .lastReadMessageId,
                        lastReadAt:
                          readPayload.read
                            .lastReadAt ??
                          current.attention
                            .lastReadAt,
                      },
                    }
                  : current,
            );
          }
        } catch {
          /*
           * Read acknowledgement is secondary
           * to durable Field retrieval.
           */
        }
      }
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

            {field.attention.unreadCount > 0 ? (
              <span
                className={styles.attention}
                role="status"
              >
                New activity · {field.attention.unreadCount}
              </span>
            ) : null}
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
        ) : field?.timeline && field.timeline.items.length > 0 ? (
          field.timeline.items.map((item) => {
            if (item.itemType === "INSTITUTIONAL_REFLECTION") {
              const reflection = item.reflection;

              return (
                <aside
                  key={`reflection:${reflection.id}`}
                  className={styles.reflection}
                  aria-label="Institutional observation"
                >
                  <div className={styles.reflectionRule} />

                  <div className={styles.reflectionRecord}>
                    <div className={styles.reflectionHead}>
                      <span className={styles.reflectionBadge}>
                        Institutional Observation
                      </span>

                      <span className={styles.reflectionTime}>
                        {formatDate(reflection.sourceOccurredAt)}
                      </span>
                    </div>

                    <p className={styles.reflectionTitle}>
                      {institutionalLabel(reflection.reflectionCode)}
                    </p>

                    <p className={styles.reflectionProvenance}>
                      {institutionalLabel(reflection.sourceSystem)}
                      <span aria-hidden="true"> · </span>
                      {institutionalLabel(reflection.sourceAggregateType)}
                    </p>

                    <p
                      className={styles.reflectionContext}
                      title={`${reflection.targetSubtype} · ${reflection.targetId}`}
                    >
                      Context · {institutionalLabel(reflection.targetSubtype)}
                    </p>

                    <p className={styles.reflectionDoctrine}>
                      Recorded institutional outcome · no authority is created
                      by this observation.
                    </p>
                  </div>

                  <div className={styles.reflectionRule} />
                </aside>
              );
            }

            const message = item.message;

            return (
              <article
                key={`message:${message.id}`}
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
            );
          })
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
