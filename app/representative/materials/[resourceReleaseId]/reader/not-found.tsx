"use client";

import CupReaderReady from "../../../CupReaderReady";
import CupReaderStatus from "../../../CupReaderStatus";

/**
 * The reader must notify its parent when a requested publication
 * cannot be resolved. This does not disclose the reason for denial
 * or weaken the canonical VIEW authorization boundary.
 */
export default function MaterialNotFound() {
  return (
    <main style={{ height: "100dvh", margin: 0 }}>
      <CupReaderReady state="error" />
      <CupReaderStatus
        error="This material is unavailable for reading. Return to your resources or use Open separately."
      />
    </main>
  );
}
