"use client";
export default function MaterialError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{ minHeight: "100vh", background: "#0c1d25", color: "#d3e2e6", padding: 24, fontFamily: "Arial, sans-serif" }}>
    <p role="alert">This material could not be opened.</p>
    <p>Try again, or return to the CUP and use Open separately.</p>
    <button type="button" onClick={reset} style={{ padding: "10px 16px", border: "1px solid #8eafb9", color: "#eed5a5", background: "transparent", cursor: "pointer" }}>Try again</button>
  </main>;
}
