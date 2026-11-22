"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function OpenRepresentativeFieldRoom({ participantId }: { participantId: string }) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function open() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/representative-program/participants/${encodeURIComponent(participantId)}/field-conversation`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      const result = await response.json();
      if (!response.ok || !result.ok || typeof result.conversationId !== "string" || !result.conversationId) {
        throw new Error(result.error || "Field conversation could not be opened.");
      }
      router.push(`/admin/communications?conversationId=${encodeURIComponent(result.conversationId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Field conversation could not be opened.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="max-w-sm">
      <button type="button" onClick={() => void open()} disabled={busy}
        className="rounded border border-cyan-700 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-950/40 disabled:cursor-wait disabled:opacity-50">
        {busy ? "Opening field conversation…" : "Open field conversation →"}
      </button>
      <p className="mt-1 text-[11px] text-gray-500">Creates or opens the participant room. Sends no message.</p>
      {error ? <p role="alert" className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
