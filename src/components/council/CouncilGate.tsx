"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CouncilGate.module.css";
import { useRouter } from "next/navigation";

type Status = "idle" | "typing" | "verifying" | "approved" | "denied";

export default function CouncilGate({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [seatKey, setSeatKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [hint, setHint] = useState<string>("Seat credential required.");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const disabled = status === "verifying" || status === "approved";

  const label = useMemo(() => {
    if (status === "verifying") return "Verifying authority…";
    if (status === "approved") return "Seat verified. Proceeding…";
    if (status === "denied") return "Denied. Credential not recognized.";
    return "AXPT://AUTH";
  }, [status]);

  useEffect(() => {
    if (!open) return;

    setStatus("idle");
    setHint("Seat credential required.");
    setSeatKey("");

    // focus after animation frame
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

useEffect(() => {
  if (open) {
    document.documentElement.classList.add("council-active");
  } else {
    document.documentElement.classList.remove("council-active");
  }

  return () => {
    document.documentElement.classList.remove("council-active");
  };
}, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Enter") {
        // allow Enter anywhere while open
        void verify();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seatKey, status]);

  async function verify() {
    if (!open) return;
    if (disabled) return;

    const key = seatKey.trim();
    if (key.length < 8) {
      setStatus("denied");
      setHint("Input too short.");
      return;
    }

    setStatus("verifying");
    setHint("Issuing verification request…");

    try {
      const res = await fetch("/api/council/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatKey: key }),
      });

      if (!res.ok) {
        setStatus("denied");
        setHint("Credential not recognized.");
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!data.ok) {
        setStatus("denied");
        setHint("Credential not recognized.");
        return;
      }

      setStatus("approved");
      setHint("Session sealed.");

      // small ceremonial beat
      setTimeout(() => {
        onClose();
        router.push("/council");
      }, 650);
    } catch {
      setStatus("denied");
      setHint("Network fault. Try again.");
    }
  }

  if (!open) return null;

  return (
    <div className={styles.veil} role="dialog" aria-modal="true" aria-label="Council authentication">
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div className={styles.shell}>
        <div className={styles.sigil} aria-hidden="true" />
        <div className={styles.glow} aria-hidden="true" />

        <div className={styles.topLine}>
          <span className={styles.header}>{label}</span>
          <span className={`${styles.pulseDot} ${status === "approved" ? styles.ok : ""}`} aria-hidden="true" />
        </div>

        <p className={styles.hint}>{hint}</p>

        <div className={styles.promptRow}>
          <span className={styles.prompt}>SEAT_KEY</span>

          <div className={styles.inputWrap}>
            <input
              ref={inputRef}
              className={styles.input}
              value={seatKey}
              onChange={(e) => {
                setSeatKey(e.target.value);
                if (status !== "verifying" && status !== "approved") setStatus("typing");
              }}
              placeholder="Enter credential"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={disabled}
            />
            <span className={styles.cursor} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.inlineAction} onClick={verify} disabled={disabled}>
            {status === "verifying" ? "Verifying…" : "Submit"}
          </button>

          <span className={styles.sep} aria-hidden="true" />

          <button className={styles.inlineAction} onClick={onClose} disabled={disabled}>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}