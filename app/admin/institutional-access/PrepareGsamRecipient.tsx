"use client";

import { useState } from "react";

export function PrepareGsamRecipient() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function prepare() {
    if (!window.confirm(
      "Prepare two pending GSAM document-access requests for James Crawford? No grants or emails will be issued."
    )) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/institutional-access/prepare-gsam",
        { method: "POST" }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          `HTTP ${response.status}: ${
            typeof result.error === "string"
              ? result.error
              : JSON.stringify(result)
          }`
        );
      }

      setMessage(
        `${result.prepared.length} request(s) prepared; ${result.alreadyPresent.length} already present.`
      );
      // Preserve the server result for operator inspection.
      // Refresh the administration page manually after verification.
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{
      padding: 20,
      border: "1px solid #30445b",
      background: "#0d1725",
      marginBottom: 24,
    }}>
      <h2>Prepare GSAM Recipient</h2>
      <p>James Crawford · james.crawfordgcsam@protonmail.com</p>
      <p>100 MT and 1,000 MT SCOs · Supporting Document View · Version 1</p>
      <button
        type="button"
        disabled={busy}
        onClick={prepare}
        style={{
          padding: "10px 16px",
          background: "#1b3552",
          color: "white",
          cursor: "pointer",
        }}
      >
        {busy ? "Preparing..." : "Prepare two pending requests"}
      </button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
