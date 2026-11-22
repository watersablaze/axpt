import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { loadOwnedIssuedAppointmentCertificate } from
  "@/domains/instruments/representative-program/application/issueRepresentativeAppointmentCredential";
import { readPrivateAppointmentCertificate } from
  "@/domains/instruments/representative-program/application/appointmentCertificateRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ appointmentId: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
  const principal = await getPrincipal();
  if (!principal) return new NextResponse(null, { status: 401, headers });

  try {
    const { appointmentId } = await context.params;
    const certificate = await loadOwnedIssuedAppointmentCertificate({
      client: prisma,
      userId: principal.userId,
      appointmentId,
    });
    if (!certificate) return new NextResponse(null, { status: 404, headers });

    const bytes = await readPrivateAppointmentCertificate(
      certificate.uri, certificate.contentHash,
    );
    const filename = `${certificate.reference}-certificate.pdf`
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch {
    console.error("[ARP_APPOINTMENT_CREDENTIAL_FAILED]");
    return new NextResponse(null, { status: 503, headers });
  }
}
