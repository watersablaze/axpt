"use client";

import { useState, type FormEvent } from "react";
import styles from "./ProfileAccessRequest.module.css";

type Props = { initialName?: string; initialEmail?: string };
type RequestState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

function value(form: FormData, name: string) {
  const entry = form.get(name);
  return typeof entry === "string" ? entry.trim() : "";
}

export default function ProfileAccessRequest({ initialName = "", initialEmail = "" }: Props) {
  const [state, setState] = useState<RequestState>({ status: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ status: "submitting" });
    try {
      const response = await fetch("/api/french-ward/profile/access-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requesterName: value(form, "requesterName"),
          requesterEmail: value(form, "requesterEmail"),
          institutionalAffiliation: value(form, "institutionalAffiliation"),
          requesterCapacity: value(form, "requesterCapacity"),
          purpose: value(form, "purpose"),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Unable to submit request.");
      setState({ status: "success" });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Unable to submit request." });
    }
  }

  return (
    <section data-fw-profile-request className={styles.reception} aria-labelledby="fw-profile-access-title">
      <div className={styles.head}>
        <p className={styles.kicker}>FRENCH-WARD, INC. / CORPORATE PROFILE</p>
        <h1 id="fw-profile-access-title">Custodianship &amp; <span>Commercial Practice</span></h1>
        <p>Discover French-Ward’s source relationships, leadership and commercial practice. Request access to the full corporate profile below.</p>
      </div>
      {state.status === "success" ? (
        <div className={styles.success} role="status">
          <strong>Request received.</strong>
          <p>Your request has been received for review. French-Ward Administration will advise you on access.</p>
        </div>
      ) : (
        <>
          <div className={styles.signin}>
            <span>Already approved?</span>
            <a href="/login?next=%2Ffrench-ward%2Fprofile">Sign in with your approved email ↗</a>
          </div>
          <div className={styles.registerSection} aria-label="Publication access register">
            <div className={styles.registerIndex} aria-hidden="true">
              <span>FW / ACCESS REGISTER</span>
              <span>FULL PROFILE / ACCESS REQUEST</span>
            </div>
            <form className={styles.form} onSubmit={onSubmit}>
            <label>Name<input name="requesterName" required defaultValue={initialName} /></label>
            <label>Email<input type="email" name="requesterEmail" required defaultValue={initialEmail} /></label>
            <label>Institution / Organization<input name="institutionalAffiliation" required /></label>
            <label>Capacity<input name="requesterCapacity" required placeholder="Your role or capacity" /></label>
            <label className={styles.full}>Purpose of access<textarea name="purpose" rows={4} required placeholder="Briefly describe your interest in French-Ward." /></label>
            <button type="submit" disabled={state.status === "submitting"}>
              {state.status === "submitting" ? "Submitting…" : "REQUEST PROFILE ACCESS"}
            </button>
            {state.status === "error" && <p role="alert" className={styles.error}>{state.message}</p>}
            </form>
          </div>
        </>
      )}
      <p className={styles.notice}>The full profile is available by individual approval. Commercial inquiries and proposed transactions are reviewed separately.</p>
      <nav className={styles.returnNav} aria-label="Return to French-Ward">
        <a href="/french-ward"><span aria-hidden="true">←</span> RETURN TO FRENCH-WARD</a>
      </nav>
    </section>
  );
}
