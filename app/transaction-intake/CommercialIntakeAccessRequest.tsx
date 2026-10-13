"use client";

import {
  FormEvent,
  useState,
} from "react";

import styles from "./commercial-intake-access.module.css";

type Props = {
  initialName?: string;
  initialEmail?: string;
};

const COMMERCIAL_INTAKE_SIGN_IN_HREF =
  "/login?next=%2Ffrench-ward%2Ftransaction-intake";

type RequestState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

function value(
  formData: FormData,
  key: string,
) {
  const entry =
    formData.get(key);

  return typeof entry === "string"
    ? entry.trim()
    : "";
}

export default function CommercialIntakeAccessRequest({
  initialName = "",
  initialEmail = "",
}: Props) {
  const [
    state,
    setState,
  ] = useState<RequestState>({
    status: "idle",
  });

  async function onSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData =
      new FormData(
        event.currentTarget,
      );

    setState({
      status:
        "submitting",
    });

    try {
      const response =
        await fetch(
          "/api/french-ward/transaction-intake/access-request",
          {
            method:
              "POST",

            headers: {
              "content-type":
                "application/json",
            },

            body:
              JSON.stringify({
                requesterName:
                  value(
                    formData,
                    "requesterName",
                  ),

                requesterEmail:
                  value(
                    formData,
                    "requesterEmail",
                  ),

                institutionalAffiliation:
                  value(
                    formData,
                    "institutionalAffiliation",
                  ),

                requesterCapacity:
                  value(
                    formData,
                    "requesterCapacity",
                  ),

                purpose:
                  value(
                    formData,
                    "purpose",
                  ),
              }),
          },
        );

      const payload =
        await response
          .json()
          .catch(
            () => null,
          );

      if (
        !response.ok ||
        !payload?.ok
      ) {
        throw new Error(
          payload?.error ||
            "Unable to submit access request.",
        );
      }

      setState({
        status:
          "success",
      });
    } catch (error) {
      setState({
        status:
          "error",

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to submit access request.",
      });
    }
  }

  if (
    state.status ===
    "success"
  ) {
    return (
      <section
        className={
          styles.panel
        }
      >
        <p
          className={
            styles.eyebrow
          }
        >
          Request Received
        </p>

        <h2>
          Commercial intake
          access is under
          review.
        </h2>

        <p>
          French-Ward
          reviews commercial
          intake access
          individually.
          Approval permits
          access to the
          controlled intake
          process only.
        </p>

        <p
          className={
            styles.notice
          }
        >
          Approval does not
          constitute
          transaction
          acceptance,
          appointment,
          representation,
          negotiation
          authority, or
          signing authority.
        </p>
      </section>
    );
  }

  return (
    <section
      className={
        styles.panel
      }
    >
      <p
        className={
          styles.eyebrow
        }
      >
        Controlled
        Commercial Entry
      </p>

      <h2>
        Request Commercial
        Intake Access
      </h2>

      <p
        className={
          styles.intro
        }
      >
        The French-Ward
        Letter of Intent and
        Transaction Intake
        is available through
        individually reviewed
        institutional access.
      </p>

      <div
        className={
          styles.signInPanel
        }
      >
        <div>
          <strong>
            Already approved?
          </strong>

          <p>
            Sign in with the
            institutional email
            associated with your
            approved access.
          </p>
        </div>

        <a
          className={
            styles.signInLink
          }
          href={
            COMMERCIAL_INTAKE_SIGN_IN_HREF
          }
        >
          Sign in with approved access
        </a>
      </div>

      <form
        className={
          styles.form
        }
        onSubmit={
          onSubmit
        }
      >
        <label>
          Name
          <input
            name="requesterName"
            required
            defaultValue={
              initialName
            }
          />
        </label>

        <label>
          Email
          <input
            name="requesterEmail"
            type="email"
            required
            defaultValue={
              initialEmail
            }
          />
        </label>

        <label>
          Institution /
          Organization
          <input
            name="institutionalAffiliation"
            required
          />
        </label>

        <label>
          Capacity
          <input
            name="requesterCapacity"
            required
            placeholder="Director, buyer representative, principal, counsel…"
          />
        </label>

        <label>
          Purpose
          <textarea
            name="purpose"
            required
            rows={4}
            placeholder="Briefly describe the proposed commercial purpose."
          />
        </label>

        <button
          type="submit"
          disabled={
            state.status ===
            "submitting"
          }
        >
          {state.status ===
          "submitting"
            ? "Submitting…"
            : "Request Access"}
        </button>

        {state.status ===
          "error" && (
          <p
            className={
              styles.error
            }
            role="alert"
          >
            {
              state.message
            }
          </p>
        )}
      </form>

      <p
        className={
          styles.notice
        }
      >
        Access permits use
        of the defined
        commercial-intake
        channel only. It does
        not establish a
        transaction,
        representation,
        negotiation
        authority, signing
        authority, or any
        obligation of
        French-Ward.
      </p>
    </section>
  );
}
