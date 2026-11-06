"use client";

import {
  useRef,
  useState,
  type FormEvent,
} from "react";

import styles from
  "../home.module.css";

type Receipt = {
  intake: {
    id: string;
    reference: string;
    status: string;
    alreadyRegistered: boolean;
  };

  evidence: {
    sha256: string;
    byteLength: number;
    disposition: string;
  };

  registrationMode: string;
  buyerAuthorityVerified: boolean;
  representativeAuthorityGranted: boolean;
  opportunityPromoted: boolean;
};

type Result = {
  ok?: boolean;
  error?: string;

  intake?: Receipt["intake"];
  evidence?: Receipt["evidence"];

  registrationMode?: string;
  buyerAuthorityVerified?: boolean;
  representativeAuthorityGranted?: boolean;
  opportunityPromoted?: boolean;
};

const endpoint =
  "/api/french-ward/home/actions/register-buyer-transaction";

function userMessage(
  code?: string,
) {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
      return "The current session is not authenticated.";

    case "FW_TXN_GOVERNING_REGISTRATION_AUTHORITY_REQUIRED":
      return "Current French-Ward governing authority does not permit this registration.";

    case "REQUEST_ORIGIN_REQUIRED":
    case "REQUEST_ORIGIN_INVALID":
    case "REQUEST_ORIGIN_MISMATCH":
    case "REQUEST_HOST_MISMATCH":
      return "This registration was rejected by the request-origin boundary.";

    case "MULTIPART_REQUIRED":
      return "The documentary registration payload could not be accepted.";

    case "REQUEST_TOO_LARGE":
      return "The registration or evidence PDF exceeds the permitted size.";

    case "EVIDENCE_PDF_REQUIRED":
      return "Attach the documentary evidence PDF.";

    case "EVIDENCE_PDF_INVALID":
      return "Evidence must be a valid PDF within the permitted size.";

    case "UNEXPECTED_OR_DUPLICATE_FIELD":
    case "REQUIRED_TEXT_FIELD_MISSING":
    case "INVALID_TEXT_FIELD":
    case "INVALID_SUBMITTER_EMAIL":
    case "INVALID_INTRODUCTION_CHANNEL":
    case "INVALID_EXTERNAL_INTAKE":
      return "Review the documentary registration fields and evidence.";

    case "PRIVATE_STORAGE_UNAVAILABLE":
    case "EVIDENCE_CUSTODY_UNAVAILABLE":
      return "Private evidence custody is not currently available.";

    case "REGISTRATION_CONFLICT":
      return "This operational reference is already bound to materially different registration evidence or facts.";

    default:
      return "The registration could not be confirmed.";
  }
}

export default function RegisterBuyerTransactionAction() {
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

    /*
     * Browser supplies documentary facts + evidence only.
     *
     * The governing route supplies:
     * - authenticated actor;
     * - institutional capability;
     * - governing confirmation;
     * - custody identity;
     * - evidence digest;
     * - governing authority mode.
     */
    form.delete(
      "confirmation",
    );

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

            body:
              form,
          },
        );

      const result =
        await response.json() as
          Result;

      if (
        !response.ok ||
        !result.ok ||
        !result.intake ||
        !result.evidence ||
        !result.registrationMode
      ) {
        setError(
          userMessage(
            result.error,
          ),
        );

        return;
      }

      setReceipt({
        intake:
          result.intake,

        evidence:
          result.evidence,

        registrationMode:
          result.registrationMode,

        buyerAuthorityVerified:
          Boolean(
            result.buyerAuthorityVerified,
          ),

        representativeAuthorityGranted:
          Boolean(
            result.representativeAuthorityGranted,
          ),

        opportunityPromoted:
          Boolean(
            result.opportunityPromoted,
          ),
      });
    } catch {
      /*
       * The operational reference is the stable registration identity.
       * If transport is interrupted, do not invent a new reference merely
       * to retry an otherwise unchanged registration.
       */
      setError(
        "The response was interrupted. Verify the existing record before changing the operational reference or resubmitting materially different facts.",
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
    return (
      <section
        className={
          styles.sendLoiReceipt
        }
        aria-live="polite"
      >
        <div>
          <span>
            REGISTRATION RECORDED
          </span>

          <strong>
            {receipt.intake.status}
          </strong>
        </div>

        <p>
          The introduced commercial
          matter has been recorded as an
          Intake. Registration preserves
          documentary continuity only; it
          does not establish buyer
          authority, representative
          authority, transaction approval,
          or Opportunity status.
        </p>

        <dl>
          <div>
            <dt>
              Intake
            </dt>

            <dd>
              {receipt.intake.reference}
            </dd>
          </div>

          <div>
            <dt>
              Status
            </dt>

            <dd>
              {receipt.intake.status}
            </dd>
          </div>

          <div>
            <dt>
              Existing
            </dt>

            <dd>
              {receipt.intake
                .alreadyRegistered
                ? "YES"
                : "NO"}
            </dd>
          </div>
        </dl>

        <dl>
          <div>
            <dt>
              Buyer authority
            </dt>

            <dd>
              {receipt
                .buyerAuthorityVerified
                ? "VERIFIED"
                : "UNVERIFIED"}
            </dd>
          </div>

          <div>
            <dt>
              Representative authority
            </dt>

            <dd>
              {receipt
                .representativeAuthorityGranted
                ? "GRANTED"
                : "NOT GRANTED"}
            </dd>
          </div>

          <div>
            <dt>
              Opportunity
            </dt>

            <dd>
              {receipt
                .opportunityPromoted
                ? "CREATED"
                : "NOT CREATED"}
            </dd>
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
            REGISTER BUYER / TRANSACTION
          </span>

          <h3>
            Record a commercial
            introduction
          </h3>
        </div>

        <p>
          Preserve an externally received
          buyer or transaction
          introduction through the
          French-Ward documentary intake
          and private evidence-custody
          path. Registration does not
          approve the transaction or
          establish commercial authority.
        </p>
      </div>

      <div
        className={
          styles.sendLoiFields
        }
      >
        <label>
          <span>
            Operational reference
          </span>

          <input
            name="operationalReference"
            type="text"
            maxLength={200}
            required
            disabled={pending}
            placeholder="FW-TXN-..."
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Use the French-Ward working reference assigned to this introduction.
            <span>
              Example: FW-TXN-2026-004
            </span>
          </small>
        </label>

        <label>
          <span>
            Submitter name
          </span>

          <input
            name="submitterName"
            type="text"
            maxLength={200}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Person entering or forwarding the introduction.
          </small>
        </label>

        <label>
          <span>
            Submitter email
          </span>

          <input
            name="submitterEmail"
            type="email"
            maxLength={320}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Working email for documentary follow-up.
          </small>
        </label>

                <fieldset
          className={
            styles.registerCapacityField
          }
          data-register-section="submitter"
        >
          <legend>
            Submitter capacity
          </legend>

          <div
            className={
              styles.registerCapacityChoices
            }
          >
            <label>
              <input
                name="submitterRole"
                type="radio"
                value="GOVERNING_OFFICER"
                required
                disabled={pending}
              />

              <span>
                <strong>
                  Governing Officer
                </strong>

                <small>
                  Institutional governing capacity
                </small>
              </span>
            </label>

            <label>
              <input
                name="submitterRole"
                type="radio"
                value="REPRESENTATIVE"
                required
                disabled={pending}
              />

              <span>
                <strong>
                  Representative
                </strong>

                <small>
                  Recognized representative capacity
                </small>
              </span>
            </label>

            <label>
              <input
                name="submitterRole"
                type="radio"
                value="INTERMEDIARY_UNVERIFIED"
                required
                disabled={pending}
                defaultChecked
              />

              <span>
                <strong>
                  Intermediary
                </strong>

                <small>
                  Unverified external introduction
                </small>
              </span>
            </label>
          </div>

          <p>
            Select the capacity in which the person is
            submitting this record. This describes
            provenance only; it does not grant governing,
            representative, negotiation, signature or
            commercial authority.
          </p>
        </fieldset>

        <label>
          <span>
            Buyer
          </span>

          <input
            name="buyerName"
            type="text"
            maxLength={200}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Legal or commonly recognized buyer, refinery or trading entity.
          </small>
        </label>

        <label>
          <span>
            Commodity
          </span>

          <input
            name="commodity"
            type="text"
            maxLength={200}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Material being proposed.
            <span>
              Example: Gold doré · 96%+
            </span>
          </small>
        </label>

        <label>
          <span>
            Trial quantity
          </span>

          <input
            name="trialQuantity"
            type="text"
            maxLength={200}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Initial quantity proposed for qualification.
            <span>
              Example: 50 KG
            </span>
          </small>
        </label>

        <label>
          <span>
            Monthly quantity
          </span>

          <input
            name="monthlyQuantity"
            type="text"
            maxLength={200}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Expected recurring quantity after trial.
            <span>
              Example: 100 KG / month
            </span>
          </small>
        </label>

        <label>
          <span>
            Destination
          </span>

          <input
            name="destination"
            type="text"
            maxLength={200}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Receiving country, refinery, free zone or agreed destination.
            <span>
              Example: Dubai, UAE
            </span>
          </small>
        </label>

        <label>
          <span>
            Originating candidate
          </span>

          <input
            name="originatingCandidateName"
            type="text"
            maxLength={200}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Person or organization from whom this introduction originated.
          </small>
        </label>

        <label>
          <span>
            Introduction channel
          </span>

          <input
            name="introductionChannelName"
            type="text"
            maxLength={200}
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            How the introduction reached French-Ward.
            <span>
              Example: Representative referral · Direct buyer introduction
            </span>
          </small>
        </label>

        <label>
          <span>
            Settlement method
          </span>

          <input
            name="settlementMethod"
            type="text"
            maxLength={200}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Proposed method only; not an approved settlement instruction.
            <span>
              Example: USDT · Bank wire
            </span>
          </small>
        </label>

        <label
          className={
            styles.sendLoiPurpose
          }
        >
          <span>
            Delivery terms
          </span>

          <textarea
            name="deliveryTerms"
            maxLength={2000}
            rows={4}
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Known shipment, refinery, custody or delivery expectations. Record facts only.
          </small>
        </label>

        <label
          className={
            styles.sendLoiPurpose
          }
        >
          <span>
            Documentary evidence PDF
          </span>

          <input
            name="evidencePdf"
            type="file"
            accept="application/pdf,.pdf"
            required
            disabled={pending}
          />
          <small
            className={
              styles.registerFieldHelp
            }
          >
            Attach the LOI, buyer letter, mandate, proposal or other source document supporting this introduction.
            <span>
              PDF only.
            </span>
          </small>
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
          Registration creates or
          reconciles an Intake record in
          SUBMITTED posture and preserves
          the attached evidence privately.
          It does not create an
          Opportunity, approve terms, or
          confer buyer or representative
          authority.
        </p>

        <button
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Recording…"
            : "Register Intake"}
        </button>
      </div>
    </form>
  );
}
