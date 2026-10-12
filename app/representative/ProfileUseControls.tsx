"use client";

import { useState } from "react";

export default function ProfileUseControls({
  resourceReleaseId,
}: {
  resourceReleaseId: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function useProfile(action: "PRESENT" | "TRANSMIT") {
    setPending(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/representative/commercial-utility-packs/resources/" +
          encodeURIComponent(resourceReleaseId) + "/profile/use",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
          cache: "no-store",
        },
      );
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setMessage("This action is currently unavailable. Consult your Authority Register or French-Ward operator.");
        return;
      }

      // Accept only the exact destination for this authorized action.
      const expectedUrl = action === "PRESENT"
        ? "/representative/resources/" + encodeURIComponent(resourceReleaseId)
        : "https://www.axpt.io/french-ward/profile";
      if (result.action !== action || result.url !== expectedUrl) {
        throw new Error("UNEXPECTED_DESTINATION");
      }

      if (action === "TRANSMIT") {
        await navigator.clipboard.writeText(result.url);
        setMessage("Profile access link copied. Recipient approval is required. No message has been sent.");
      } else {
        window.location.assign(result.url);
      }
    } catch {
      setMessage("The action could not be completed. Retry or consult your French-Ward operator.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="profile-use-heading"
      className="mt-6 border-t border-[#30495c] py-5">
      <h2 id="profile-use-heading" className="text-base font-medium text-[#eee7da]">
        Use the Official Profile
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#b7c5ce]">
        Each action checks your current appointment, authority, and resource permissions.
        Presentation opens your CUP publication. The shared link leads to
        institutional access review; it does not grant recipient access.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={pending}
          onClick={() => useProfile("PRESENT")}
          className="rounded border border-[#567ba0] px-4 py-2 text-sm text-[#eee7da] disabled:opacity-50">
          Open for Presentation
        </button>
        <button type="button" disabled={pending}
          onClick={() => useProfile("TRANSMIT")}
          className="rounded border border-[#567ba0] px-4 py-2 text-sm text-[#eee7da] disabled:opacity-50">
          Copy Profile Access Link
        </button>
      </div>
      <p role="status" aria-live="polite"
        className="mt-3 text-sm text-[#d8c39b]">{message}</p>
    </section>
  );
}
