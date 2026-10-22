"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  useCommunicationsStream,
} from "@/lib/realtime/communications/useCommunicationsStream";

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
  initialField?: FieldState | null;
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
  initialField = null,
}: FieldCommunicationsProps = {}) {
  const [field, setField] =
    useState<FieldState | null>(
      initialField,
    );

  const [loading, setLoading] =
    useState(
      !previewMode &&
      !initialField,
    );

  const [error, setError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);

  const [body, setBody] = useState("");

  const [entryOpen, setEntryOpen] = useState(false);

  const [
    interactionPreview,
    setInteractionPreview,
  ] = useState(false);

  const [
    simulatedMessages,
    setSimulatedMessages,
  ] = useState<
    Array<{
      id: string;
      body: string;
      kind: MessageType;
      createdAt: string;
    }>
  >([]);

  const [messageType, setMessageType] = useState<MessageType>("COMMENT");

  const [context, setContext] = useState<FieldContext>({
    type: "WORKSPACE",
  });

  const realtime =
    useCommunicationsStream(
      "/api/representative/communications/stream",
      !previewMode,
    );

  const effectiveMessageType = useMemo<MessageType>(
    () => (context.type === "CUP_RESOURCE" ? "RESOURCE_COMMENT" : messageType),
    [context, messageType],
  );

  async function load(
    options?: {
      acknowledgeMessages?: boolean;
    },
  ) {
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

      const acknowledgeMessages =
        options?.acknowledgeMessages ??
        true;

      if (
        acknowledgeMessages &&
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

  /*
   * Realtime is advisory only.
   *
   * Signals never mutate Field state directly.
   * They trigger authoritative HTTP retrieval.
   *
   * Reflection freshness must never advance
   * the representative message read marker.
   */
  useEffect(() => {
    if (
      previewMode ||
      !realtime.lastSignal
    ) {
      return;
    }

    const signal =
      realtime.lastSignal;

    /*
     * The representative SSE endpoint is already
     * conversation-scoped server-side, but retain
     * the client-side room check as a stale-signal
     * guard across Field lifecycle transitions.
     */
    if (
      field?.room?.conversationId &&
      signal.conversationId !==
        field.room.conversationId
    ) {
      return;
    }

    const isReflectionSignal =
      signal.type ===
      "COMMUNICATION_INSTITUTIONAL_REFLECTION_AVAILABLE";

    void load({
      acknowledgeMessages:
        !isReflectionSignal,
    });
  }, [
    previewMode,
    realtime.revision,
    realtime.lastSignal,
    field?.room?.conversationId,
  ]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = body.trim();

    if (
      previewMode &&
      interactionPreview
    ) {
      if (!trimmed) {
        return;
      }

      setSimulatedMessages(
        (current) => [
          ...current,
          {
            id:
              typeof crypto !==
                "undefined" &&
              typeof crypto.randomUUID ===
                "function"
                ? crypto.randomUUID()
                : `preview-${Date.now()}`,
            body: trimmed,
            kind:
              effectiveMessageType,
            createdAt:
              new Date().toISOString(),
          },
        ],
      );

      setBody("");
      setEntryOpen(false);
      return;
    }

    if (previewMode) {
      return;
    }

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
        <div
          className={styles.previewNotice}
          role="status"
        >
          <div>
            <strong>
              {interactionPreview
                ? "INTERACTION_PREVIEW"
                : "CANONICAL_VIEW"}
            </strong>

            <span>
              {interactionPreview
                ? "local simulation · no mutation · no representative authority"
                : "canonical field record · representative actions withheld"}
            </span>
          </div>

          <button
            type="button"
            className={styles.previewModeToggle}
            onClick={() => {
              setInteractionPreview(
                (current) => !current,
              );
              setEntryOpen(false);
              setBody("");
              setSimulatedMessages([]);
            }}
          >
            {interactionPreview
              ? "RETURN TO CANONICAL VIEW"
              : "OPEN INTERACTION PREVIEW"}
          </button>
        </div>
      ) : null}

      <header className={styles.terminalHeader}>
        <div className={styles.terminalTitleRow}>
          <h1
            id="field-communications-title"
            className={styles.terminalTitle}
          >
            FIELD://COMMUNICATIONS
          </h1>

          <span className={styles.stateToken}>
            {field?.room ? "OPEN" : "READY"}
          </span>
        </div>

        <dl className={styles.terminalMeta}>
          <div>
            <dt>representative</dt>
            <dd>{field?.participant.displayName ?? "—"}</dd>
          </div>

          <div>
            <dt>record</dt>
            <dd>{field?.participant.docketReference ?? "—"}</dd>
          </div>

          <div>
            <dt>context</dt>
            <dd>{contextLabel(context).replaceAll(" ", "_").toUpperCase()}</dd>
          </div>

          <div>
            <dt>activity</dt>
            <dd
              className={
                field?.attention.unreadCount
                  ? styles.activityLive
                  : undefined
              }
            >
              {String(field?.attention.unreadCount ?? 0).padStart(2, "0")}
              {" "}
              UNREAD
            </dd>
          </div>
        </dl>

        {context.type !== "WORKSPACE" ? (
          <button
            type="button"
            className={styles.contextClear}
            onClick={clearContext}
          >
            CLEAR_CONTEXT
          </button>
        ) : null}
      </header>

      <div className={styles.timeline} aria-live="polite">
        {loading ? (
          <div className={styles.loading}>
            FIELD_RECORD::LOADING
          </div>
        ) : field?.timeline?.items?.length ? (
          field.timeline.items.map((item) => {
            if (item.itemType === "INSTITUTIONAL_REFLECTION") {
              const reflection = item.reflection;

              return (
                <aside
                  key={`reflection:${reflection.id}`}
                  className={styles.reflection}
                >
                  <div className={styles.reflectionHead}>
                    <span>:: institutional_observation</span>
                    <time>{formatDate(reflection.createdAt)}</time>
                  </div>

                  <p className={styles.reflectionTitle}>
                    {institutionalLabel(reflection.reflectionCode)}
                  </p>

                  <p className={styles.reflectionTrace}>
                    {reflection.sourceSystem}
                    {" / "}
                    {reflection.sourceEventType}
                  </p>

                  <p className={styles.reflectionContext}>
                    target: {reflection.targetSubtype}
                    {" / "}
                    {reflection.targetId}
                  </p>
                </aside>
              );
            }

            const message = item.message;

            return (
              <article
                key={`message:${message.id}`}
                className={[
                  styles.dispatch,
                  message.sender.role === "REPRESENTATIVE"
                    ? styles.dispatchRepresentative
                    : styles.dispatchInstitution,
                ].join(" ")}
              >
                <header className={styles.dispatchHeader}>
                  <time>{formatDate(message.createdAt)}</time>

                  <span>
                    {message.sender.role === "FRENCH_WARD"
                      ? "FW.ADMINISTRATION"
                      : "REPRESENTATIVE"}
                  </span>

                  <span>{message.kind}</span>
                </header>

                <p className={styles.dispatchSender}>
                  {message.sender.displayName}
                </p>

                <p className={styles.dispatchBody}>
                  {message.body}
                </p>

                {message.context ? (
                  <p className={styles.dispatchContext}>
                    context: {message.context.targetSubtype}
                  </p>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className={styles.empty}>
            <span>FIELD_CHANNEL::READY</span>
            <p>No correspondence recorded.</p>
          </div>
        )}
        {previewMode &&
        interactionPreview &&
        simulatedMessages.length
          ? simulatedMessages.map(
              (message) => (
                <article
                  key={message.id}
                  className={[
                    styles.dispatch,
                    styles.dispatchRepresentative,
                    styles.simulatedDispatch,
                  ].join(" ")}
                >
                  <header
                    className={styles.dispatchHeader}
                  >
                    <time>
                      {formatDate(
                        message.createdAt,
                      )}
                    </time>

                    <span>
                      REPRESENTATIVE
                    </span>

                    <span>
                      {message.kind}
                    </span>
                  </header>

                  <p
                    className={
                      styles.dispatchSender
                    }
                  >
                    {field?.participant.displayName ??
                      "Representative"}
                  </p>

                  <p
                    className={
                      styles.dispatchBody
                    }
                  >
                    {message.body}
                  </p>

                  <p
                    className={
                      styles.simulatedFlag
                    }
                  >
                    simulation:
                    not_stored
                  </p>
                </article>
              ),
            )
          : null}
      </div>

      <aside
        className={styles.authorityBoundary}
        aria-label="Communication governance boundary"
      >
        <span className={styles.boundaryLabel}>
          AUTHORITY_BOUNDARY
        </span>

        <div className={styles.boundaryGrid}>
          <span>communication != authority</span>
          <span>appointment = separately governed</span>
          <span>resources = separately governed</span>
        </div>
      </aside>

      <div className={styles.entryShell}>
        {(
          previewMode &&
          !interactionPreview
        ) ||
        !entryOpen ? (
          <button
            type="button"
            className={styles.entryTrigger}
            disabled={
              previewMode &&
              !interactionPreview
            }
            onClick={() =>
              setEntryOpen(true)
            }
          >
            {previewMode &&
            !interactionPreview
              ? "FIELD ENTRY // PREVIEW"
              : "+ ENTER COMMUNICATION"}
          </button>
        ) : (
          <form
            className={styles.composer}
            onSubmit={submit}
          >
            <div className={styles.composerHead}>
              <div>
                <span className={styles.composerIndex}>
                  FIELD_ENTRY
                </span>

                <strong>
                  {contextLabel(context)}
                </strong>
              </div>

              {context.type === "CUP_RESOURCE" ? (
                <span className={styles.resourceContext}>
                  RESOURCE_COMMENT
                </span>
              ) : (
                <label className={styles.typeControl}>
                  <span>type</span>

                  <select
                    value={messageType}
                    onChange={(event) =>
                      setMessageType(
                        event.target.value as MessageType,
                      )
                    }
                  >
                    <option value="COMMENT">COMMENT</option>
                    <option value="REQUEST">QUESTION / REQUEST</option>
                  </select>
                </label>
              )}
            </div>

            <label className={styles.messageControl}>
              <span>message</span>

              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={10000}
                rows={5}
                autoFocus
                placeholder={
                  context.type === "CUP_RESOURCE"
                    ? "Record a question or observation about this resource."
                    : "Enter field communication."
                }
              />
            </label>

            <div className={styles.submitRow}>
              <button
                type="button"
                className={styles.cancelEntry}
                onClick={() => {
                  setEntryOpen(false);
                  setBody("");
                }}
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={
                  sending ||
                  !body.trim()
                }
              >
                {previewMode &&
                interactionPreview
                  ? "SIMULATE ENTRY"
                  : sending
                    ? "SUBMITTING..."
                    : "SUBMIT TO FRENCH-WARD"}
              </button>
            </div>
          </form>
        )}

        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
