"use client";
import CupReaderReady from "../../../CupReaderReady";
import CupReaderStatus from "../../../CupReaderStatus";
export default function MaterialError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{ height: "100dvh", margin: 0 }}>
    <CupReaderReady state="error" />
    <CupReaderStatus error="This material could not be opened." retry={reset} />
  </main>;
}
