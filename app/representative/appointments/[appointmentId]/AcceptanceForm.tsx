"use client";

import { useFormStatus } from "react-dom";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 rounded-lg border border-[#c5a25f]/40 bg-[#c5a25f]/10 px-5 py-3 text-sm text-[#d7b269] disabled:opacity-50"
    >
      {pending ? "Recording Acceptance…" : "Accept Prepared Appointment"}
    </button>
  );
}

export default function AcceptanceForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="mt-8 border-t border-white/10 pt-6">
      <label className="flex items-start gap-3 text-sm leading-7 text-white/70">
        <input
          type="checkbox"
          name="confirmAcceptance"
          value="yes"
          required
          className="mt-2"
        />
        <span>
          I have reviewed and accept the prepared appointment configuration
          shown above. Acceptance records my decision. The appointment remains
          subject to separate French-Ward activation, and delegated authority
          remains separately governed.
        </span>
      </label>
      <Submit />
    </form>
  );
}
