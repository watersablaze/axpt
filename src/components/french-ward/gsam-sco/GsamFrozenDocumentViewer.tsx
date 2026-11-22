import "server-only";
import Link from "next/link";

export function GsamFrozenDocumentViewer({
  html,
  quantityMt,
  returnUrl,
}: {
  html: string;
  quantityMt: number;
  returnUrl: string;
}) {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#f0f0ea",
      color: "#24354f",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}>
      <nav aria-label="Document navigation" style={{
        padding: "14px clamp(16px, 3vw, 40px)",
        borderBottom: "1px solid #cbd2cf",
        background: "#fffdf8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <Link href={returnUrl} style={{
          color: "#24354f",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}>
          ← Back to Documents
        </Link>
        <span style={{
          color: "#60707b",
          fontSize: 12,
          letterSpacing: ".06em",
        }}>
          SOFT CORPORATE OFFER · {quantityMt.toLocaleString("en-US")} MT
        </span>
      </nav>

      <iframe
        title={`${quantityMt.toLocaleString("en-US")} MT frozen Soft Corporate Offer`}
        srcDoc={html}
        sandbox=""
        referrerPolicy="no-referrer"
        style={{
          display: "block",
          width: "100%",
          height: "calc(100vh - 70px)",
          minHeight: 600,
          border: 0,
          background: "#fff",
        }}
      />
    </main>
  );
}
