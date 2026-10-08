import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { verifyRepresentativeAppointmentCertificate } from
  "@/domains/instruments/representative-program/application/verifyRepresentativeAppointmentCertificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

function escape(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    timeZone: "UTC",
  }).format(new Date(value)) + " UTC";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ certificateHash: string }> },
) {
  const { certificateHash } = await context.params;
  try {
    const record = await verifyRepresentativeAppointmentCertificate({
      client: prisma, certificateHash,
    });
    if (!record) return new NextResponse("Certificate record not found.", {
      status: 404, headers,
    });

    const state = record.appointmentCurrentlyEligible
      ? "Current appointment eligibility confirmed"
      : "Current appointment eligibility not confirmed";

    const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Appointment Verification · French-Ward</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#0b1720;color:#e8e5dc;font:15px/1.7 system-ui,sans-serif}
main{max-width:720px;margin:8vh auto;padding:32px}
article{border-top:2px solid #b89b64;padding:28px 0}
.issuer{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#b89b64}
h1{font:32px/1.2 Georgia,serif;margin:16px 0 28px}
h2{font-size:23px;margin:24px 0 6px}
.state{padding:16px;border-left:3px solid ${record.appointmentCurrentlyEligible ? "#79b5aa" : "#c5a268"};background:#142630}
dl{display:grid;grid-template-columns:130px 1fr;gap:12px;margin:28px 0}
dt{color:#9bb1bc}dd{margin:0;overflow-wrap:anywhere}
.note{border-top:1px solid #293f4b;padding-top:20px;color:#b7c6ce}
small{color:#9bb1bc}
@media(max-width:480px){main{margin:20px auto;padding:22px}h1{font-size:27px}dl{grid-template-columns:1fr;gap:4px}dd{margin-bottom:12px}}
</style></head><body><main><article>
<p class="issuer">French-Ward, Inc.</p>
<h1>Appointment Verification</h1>
<p>Certificate issuance recognized in the French-Ward record.</p>
<p class="state">${escape(state)}</p>
<h2>${escape(record.displayName)}</h2>
<p>${escape(record.designation.toLowerCase().replace(/_/g, " "))}</p>
<dl>
<dt>Reference</dt><dd>${escape(record.reference)}</dd>
<dt>Version</dt><dd>${record.version}</dd>
<dt>Issued</dt><dd>${escape(date(record.issuedAt))}</dd>
<dt>Checked</dt><dd>${escape(date(record.checkedAt))}</dd>
</dl>
<p class="note">This confirms the recorded certificate issuance and reports appointment eligibility at the check time. It does not confirm delegated authority, transaction approval, negotiation rights, or authority to bind French-Ward.</p>
<small>A retained certificate does not establish continuing eligibility. Check this record again before reliance.</small>
</article></main></body></html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    console.error("[ARP_CERTIFICATE_VERIFICATION_FAILED]");
    return new NextResponse("Verification is temporarily unavailable.", {
      status: 503, headers,
    });
  }
}
