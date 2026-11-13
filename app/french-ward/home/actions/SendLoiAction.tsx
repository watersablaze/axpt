"use client";

import {
  useRef,
  useState,
  type FormEvent,
} from "react";

import styles from
  "../home.module.css";

type Receipt = {
  invitationId: string;
  replay: boolean;

  delivery: {
    status: string;
    alreadyAttempted: boolean;
    messageId: string | null;
    error: string | null;
  };
};

type Result = {
  ok?: boolean;
  error?: string;
  invitationId?: string;
  replay?: boolean;
  delivery?: Receipt["delivery"];
};

const endpoint =
  "/api/french-ward/home/actions/send-loi";

function statusLabel(
  value: string,
) {
  switch (value) {
    case "ACCEPTED":
      return "Provider accepted delivery";

    case "LOGGED_ONLY":
      return "Recorded in log mode";

    case "FAILED":
      return "Delivery failed — review required";

    case "DELIVERY_UNKNOWN":
      return "Delivery outcome uncertain — do not resend";

    case "BLOCKED":
      return "Delivery blocked";

    case "SENDING":
      return "Delivery claim recorded";

    case "UNCONFIRMED":
      return "Invitation issued — delivery requires review";

    default:
      return value;
  }
}

function userMessage(
  code?: string,
) {
  switch (code) {
    case "FW_LOI_SEND_AUTHORITY_REQUIRED":
      return "Current French-Ward governing authority does not permit this action.";

    case "FW_LOI_IDEMPOTENCY_CONFLICT":
      return "This submission key is already bound to different recipient details.";

    case "FW_LOI_RECIPIENT_RECONCILIATION_REQUIRED":
      return "The recipient identity requires institutional reconciliation before invitation.";

    case "FW_LOI_INTAKE_UNAVAILABLE":
      return "Commercial Intake is not currently available.";

    case "DELIVERY_NOT_CONFIGURED":
      return "LOI delivery is not configured for this runtime.";

    case "ORIGIN_MISMATCH":
      return "This action was rejected by the request-origin boundary.";

    case "INVALID_LOI_INVITATION":
    case "INVALID_REQUEST":
      return "Review the recipient details and try again.";

    default:
      return "The invitation could not be confirmed.";
  }
}

export default function SendLoiAction() {
  const [
    pending,
    setPending,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    receipt,
    setReceipt,
  ] =
    useState<Receipt | null>(
      null,
    );

  const inFlight =
    useRef(false);

  const submission =
    useRef<{
      signature: string;
      key: string;
    } | null>(
      null,
    );

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      pending ||
      inFlight.current ||
      receipt
    ) {
      return;
    }

    const form =
      new FormData(
        event.currentTarget,
      );

    const fields = {
      recipientName:
        String(
          form.get(
            "recipientName",
          ) ?? "",
        ).trim(),

      recipientEmail:
        String(
          form.get(
            "recipientEmail",
          ) ?? "",
        )
          .trim()
          .toLowerCase(),

      recipientOrganization:
        String(
          form.get(
            "recipientOrganization",
          ) ?? "",
        ).trim(),

      purpose:
        String(
          form.get(
            "purpose",
          ) ?? "",
        ).trim(),
    };

    const signature =
      JSON.stringify(
        fields,
      );

    if (
      !submission.current ||
      submission.current
        .signature !==
        signature
    ) {
      submission.current = {
        signature,

        key:
          crypto.randomUUID(),
      };
    }

    inFlight.current =
      true;

    setPending(
      true,
    );

    setError(
      "",
    );

    try {
      const response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            cache:
              "no-store",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ...fields,

                idempotencyKey:
                  submission
                    .current
                    .key,
              }),
          },
        );

      const result =
        await response.json() as
          Result;

      if (
        !response.ok ||
        !result.ok ||
        !result.invitationId ||
        !result.delivery
      ) {
        setError(
          userMessage(
            result.error,
          ),
        );

        return;
      }

      setReceipt({
        invitationId:
          result.invitationId,

        replay:
          Boolean(
            result.replay,
          ),

        delivery:
          result.delivery,
      });
    } catch {
      /*
       * The current submission key is intentionally retained.
       * A retry of unchanged fields reuses the same issuance
       * identity instead of creating another invitation.
       */
      setError(
        "The response was interrupted. Retry only with the same recipient details so the existing submission identity is reused.",
      );
    } finally {
      inFlight.current =
        false;

      setPending(
        false,
      );
    }
  }

  if (receipt) {
    const status = receipt.delivery.status;
    const sent = status === "ACCEPTED";
    const logged = status === "LOGGED_ONLY";
    const headline = sent
      ? "LOI invitation sent"
      : logged
        ? "Invitation recorded. No email sent."
        : statusLabel(status);
    const detail = sent
      ? "The email provider accepted your invitation for delivery."
      : logged
        ? "This invitation was recorded in log mode."
        : "Check the delivery status before trying again.";

    return (
      <section
        className={styles.loiOutcomeCard}
        data-sent={sent}
        aria-label="LOI invitation receipt"
        aria-live="polite"
      >
        <div className={styles.loiOutcomeHeading}>
          {sent && <span aria-hidden="true">✓</span>}
          <h2>{headline}</h2>
        </div>
        <p>{detail}</p>
        {receipt.replay && <p>Showing the result of the original request.</p>}
        <dl className={styles.loiOutcomeDetails}>
          <div>
            <dt>Invitation reference</dt>
            <dd>{receipt.invitationId}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <form
      className={
        styles.sendLoiControl
      }
      onSubmit={
        submit
      }
    >
      <div
        className={
          styles.sendLoiHeading
        }
      >
        <div>
          <span>
            SEND LOI
          </span>

          <h3>
            Invite a commercial
            intake
          </h3>
        </div>

        <p>
          Issue one named-recipient
          invitation to the current
          French-Ward Commercial
          Intake. The invitation does
          not approve the proposed
          transaction.
        </p>
      </div>

      <div
        className={
          styles.sendLoiFields
        }
      >
        <label>
          <span>
            Recipient name
          </span>

          <input
            name="recipientName"
            type="text"
            maxLength={120}
            autoComplete="name"
            required
            disabled={pending}
          />
        </label>

        <label>
          <span>
            Recipient email
          </span>

          <input
            name="recipientEmail"
            type="email"
            maxLength={254}
            autoComplete="email"
            required
            disabled={pending}
          />
        </label>

        <label>
          <span>
            Organization
          </span>

          <input
            name="recipientOrganization"
            type="text"
            maxLength={180}
            autoComplete="organization"
            required
            disabled={pending}
          />
        </label>

        <label
          className={
            styles.sendLoiPurpose
          }
        >
          <span>
            Purpose
          </span>

          <textarea
            name="purpose"
            maxLength={1000}
            rows={5}
            required
            disabled={pending}
          />
        </label>
      </div>

      {error ? (
        <p
          className={
            styles.sendLoiError
          }
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div
        className={
          styles.sendLoiExecution
        }
      >
        <p>
          Submission records the
          governing invitation before
          delivery is attempted.
          Interrupted or uncertain
          delivery must not be
          duplicated casually.
        </p>

        <button
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Processing…"
            : "Issue & Deliver LOI"}
        </button>
      </div>
    </form>
  );
}
