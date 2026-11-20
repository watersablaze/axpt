export type FrenchWardInvitationEmailInput = Readonly<{
  reference: string;
  recipientDisplayName: string;
  institutionalTitle: string;
  secondaryTitle: string | null;
  capacityClass: "STRATEGIC" | "OPERATIONS" | "FIDUCIARY";
  accessUrl: string;
  expiresAt: Date;
}>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function required(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized || normalized.length > 191) {
    throw new Error(`FW_INVITATION_EMAIL_INVALID_${field}`);
  }

  return normalized;
}

function validateAccessUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("FW_INVITATION_EMAIL_INVALID_ACCESS_URL");
  }

  const prefix = "/french-ward/institutional/access/";
  const credential = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length)
    : "";

  if (
    url.protocol !== "https:" ||
    url.hostname !== "www.axpt.io" ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    !/^[A-Za-z0-9_-]{43}$/.test(credential)
  ) {
    throw new Error("FW_INVITATION_EMAIL_INVALID_ACCESS_URL");
  }

  return url.toString();
}

export function renderFrenchWardInstitutionalInvitationEmail(
  input: FrenchWardInvitationEmailInput,
) {
  const reference = required(input.reference, "REFERENCE");
  const name = required(
    input.recipientDisplayName,
    "RECIPIENT_NAME",
  );
  const title = required(
    input.institutionalTitle,
    "INSTITUTIONAL_TITLE",
  );

  const secondaryTitle = input.secondaryTitle?.trim() || null;
  const accessUrl = validateAccessUrl(input.accessUrl);

  if (
    !["STRATEGIC", "OPERATIONS", "FIDUCIARY"].includes(
      input.capacityClass,
    )
  ) {
    throw new Error("FW_INVITATION_EMAIL_INVALID_CAPACITY");
  }

  if (
    !Number.isFinite(input.expiresAt.getTime()) ||
    input.expiresAt <= new Date()
  ) {
    throw new Error("FW_INVITATION_EMAIL_INVALID_EXPIRY");
  }

  const expiry = input.expiresAt.toISOString();

  const subject =
    "French-Ward | Private Institutional Invitation";

  const text = [
    "FRENCH-WARD, INC.",
    "PRIVATE INSTITUTIONAL INVITATION",
    "",
    `Prepared for: ${name}`,
    `Invitation reference: ${reference}`,
    "",
    "Welcome to French-Ward. Use your private link to confirm your details and sign in to our workspace.",
    "",
    `French-Ward title: ${title}`,
    ...(secondaryTitle ? [`Additional title: ${secondaryTitle}`] : []),
    "",
    "Open your private invitation:",
    accessUrl,
    "",
    `This invitation expires: ${expiry}`,
    "",
    "This link is personal and must not be forwarded.",
    "Invitation issuance does not itself establish",
    "participation, appointment, or operational authority.",
    "",
    "French-Ward, Inc.",
    "Institutional environment via AXPT",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
</head>
<body style="margin:0;padding:32px 16px;background:#181714;color:#f4efe3;font-family:Arial,Helvetica,sans-serif">
  <main style="max-width:640px;margin:auto;padding:30px;border:1px solid #514b42">
    <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase">FRENCH-WARD, INC.</p>
    <h1 style="font-weight:normal;font-size:28px;margin:26px 0">Private Institutional Invitation</h1>
    <p>Prepared for <strong>${escapeHtml(name)}</strong></p>
    <p>Welcome to French-Ward. Use your private link to confirm your details and sign in to our workspace.</p>
    <section style="border-top:1px solid #514b42;border-bottom:1px solid #514b42;padding:20px 0;margin:24px 0">
      <p>French-Ward title: ${escapeHtml(title)}</p>
      ${secondaryTitle ? `<p>Additional title: ${escapeHtml(secondaryTitle)}</p>` : ""}
      <p>Reference: ${escapeHtml(reference)}</p>
    </section>
    <p>
      <a href="${escapeHtml(accessUrl)}" rel="noreferrer"
         style="display:inline-block;padding:14px 20px;background:#f4efe3;color:#181714;text-decoration:none;font-weight:bold">
        Open Private Invitation
      </a>
    </p>
    <p style="font-size:12px;color:#c9c1b4">Expires ${escapeHtml(expiry)} (UTC)</p>
    <p style="font-size:12px;color:#c9c1b4">This invitation is personal. Do not forward its private link. Invitation issuance does not grant appointment, permissions, or operational authority.</p>
  </main>
</body>
</html>`;

  return { subject, text, html } as const;
}
