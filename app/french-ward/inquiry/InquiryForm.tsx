"use client";

import { useState, type FormEvent } from "react";
import styles from "./inquiry.module.css";

type State = { kind: "idle" | "sending" | "sent" | "error"; message?: string };

export default function InquiryForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setState({ kind: "sending" });
    try {
      const response = await fetch("/api/french-ward/inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(values.entries())),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Inquiry could not be sent.");
      setState({ kind: "sent", message: "Your inquiry has been sent to French-Ward." });
      form.reset();
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Inquiry could not be sent." });
    }
  }

  if (state.kind === "sent") {
    return <div className={styles.receipt} role="status"><span>MESSAGE SENT</span><p>{state.message}</p><button type="button" onClick={() => setState({ kind: "idle" })}>SEND ANOTHER INQUIRY ↗</button></div>;
  }

  return (
    <section className={styles.register} aria-labelledby="inquiry-register">
      <div className={styles.index}><span id="inquiry-register">FW / CORRESPONDENCE REGISTER</span><span>DIRECT INQUIRY</span></div>
      <form onSubmit={submit} className={styles.form}>
        <label>NAME<input name="name" autoComplete="name" maxLength={120} required /></label>
        <label>EMAIL<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>ORGANIZATION<input name="organization" autoComplete="organization" maxLength={180} required /></label>
        <label>SUBJECT<select name="subject" required defaultValue=""><option value="" disabled>Select a subject</option><option value="Business relationship">Business relationship</option><option value="Commercial opportunity">Commercial opportunity</option><option value="Institutional cooperation">Institutional cooperation</option><option value="General inquiry">General inquiry</option></select></label>
        <label className={styles.full}>MESSAGE<textarea name="message" placeholder="Briefly describe your inquiry." maxLength={4000} rows={4} required /></label>
        <div className={styles.trap} aria-hidden="true"><label>Leave this blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <button disabled={state.kind === "sending"} type="submit">{state.kind === "sending" ? "SENDING…" : "SEND INQUIRY ↗"}</button>
        {state.kind === "error" && <p className={styles.error} role="alert">{state.message}</p>}
      </form>
    </section>
  );
}
