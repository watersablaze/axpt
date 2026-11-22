"use client";

import { useFormStatus } from "react-dom";
import styles from "./appointment.module.css";

function DecisionFields() {
  const { pending } = useFormStatus();

  return (
    <fieldset disabled={pending} className={styles.formFields}>
      <legend className={styles.srOnly}>Confirm appointment acceptance</legend>
      <label className={styles.confirmation}>
        <input
          type="checkbox"
          name="confirmAcceptance"
          value="yes"
          required
          className={styles.checkbox}
        />
        <span>
          I have reviewed and accept the prepared appointment configuration
          shown above.
        </span>
      </label>
      <p className={styles.decisionNote}>
        This records your acceptance. French-Ward activation and delegated
        authority remain separately governed.
      </p>
      <button
        type="submit"
        disabled={pending}
        className={styles.submit}
      >
        {pending ? "Recording Acceptance…" : "Accept Prepared Appointment"}
      </button>
      <span role="status" className={styles.srOnly}>
        {pending ? "Recording your appointment acceptance. Please wait." : ""}
      </span>
    </fieldset>
  );
}

export default function AcceptanceForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className={styles.form}>
      <DecisionFields />
    </form>
  );
}
