"use client";

import {
  FormEvent,
  useState,
} from "react";

import styles from "../../src/components/french-ward/profile/ProfileAccessRequest.module.css";

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

  return (
    <section className={styles.reception} aria-labelledby="fw-intake-access-title">
      <div className={styles.head}>
        <p className={styles.kicker}>FRENCH-WARD, INC. / COMMERCIAL INTAKE</p>
        <h1 id="fw-intake-access-title">Commercial <span>Intake Access</span></h1>
        <p>Request access to French-Ward’s Letter of Intent and Transaction Intake to present a proposed transaction for review.</p>
      </div>
      {state.status === "success" ? (
        <div className={styles.success} role="status">
          <strong>Request received.</strong>
          <p>Your commercial intake access request is awaiting review. French-Ward Administration will advise you on access.</p>
        </div>
      ) : (
        <>
          <div className={styles.signin}>
            <span>Already approved?</span>
            <a href={COMMERCIAL_INTAKE_SIGN_IN_HREF}>Sign in with your approved email ↗</a>
          </div>
          <div className={styles.registerSection} aria-label="Commercial intake access request">
            <div className={styles.registerIndex} aria-hidden="true">
              <span>FW / ACCESS REGISTER</span><span>COMMERCIAL INTAKE / REQUEST</span>
            </div>
            <form className={styles.form} onSubmit={onSubmit}>
              <label>Name<input name="requesterName" required defaultValue={initialName} /></label>
              <label>Email<input name="requesterEmail" type="email" required defaultValue={initialEmail} /></label>
              <label>Institution / Organization<input name="institutionalAffiliation" required /></label>
              <label>Capacity<input name="requesterCapacity" required placeholder="Your role or capacity" /></label>
              <label className={styles.full}>Purpose of access<textarea name="purpose" required rows={3} placeholder="Briefly describe your proposed commercial purpose." /></label>
              <button type="submit" disabled={state.status === "submitting"}>{state.status === "submitting" ? "Submitting…" : "REQUEST INTAKE ACCESS"}</button>
              {state.status === "error" && <p className={styles.error} role="alert">{state.message}</p>}
            </form>
          </div>
        </>
      )}
      <p className={styles.notice}>Access is reviewed individually. Access approval permits use of the intake form; proposed transactions remain subject to separate French-Ward review and agreement.</p>
      <nav className={styles.returnNav} aria-label="Return to French-Ward"><a href="/french-ward"><span aria-hidden="true">←</span> RETURN TO FRENCH-WARD</a></nav>
    </section>
  );
}
