export function escapeInstitutionalEmailHtml(
  value: string,
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderAxptAccessCodeEmail(input: {
  pin: string;
  expiresInMinutes: number;
  contextLabel: string;
  heading?: string;
  instruction: string;
  securityNote?: string;
}) {
  const pin =
    escapeInstitutionalEmailHtml(input.pin);

  const contextLabel =
    escapeInstitutionalEmailHtml(
      input.contextLabel,
    );

  const heading =
    escapeInstitutionalEmailHtml(
      input.heading ?? "Verification code",
    );

  const instruction =
    escapeInstitutionalEmailHtml(
      input.instruction,
    );

  const securityNote =
    escapeInstitutionalEmailHtml(
      input.securityNote ??
        "If you did not request this access event, no action is required.",
    );

  const text = [
    "AXPT",
    "SECURE INSTITUTIONAL ACCESS",
    "",
    input.contextLabel,
    "",
    `${input.heading ?? "Verification code"}: ${input.pin}`,
    "",
    input.instruction,
    "",
    `This code expires in ${input.expiresInMinutes} minutes.`,
    "",
    input.securityNote ??
      "If you did not request this access event, no action is required.",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#11110F;">
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="background:#11110F;"
    >
      <tr>
        <td align="center" style="padding:32px 14px;">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              max-width:620px;
              background:#F4EFE3;
              border:1px solid #39362F;
            "
          >
            <tr>
              <td
                style="
                  background:#1B1915;
                  padding:24px 28px;
                  border-bottom:1px solid #4A453D;
                "
              >
                <div
                  style="
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:3px;
                    text-transform:uppercase;
                    color:#F4EFE3;
                  "
                >
                  AXPT
                </div>

                <div
                  style="
                    margin-top:7px;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:9px;
                    letter-spacing:2px;
                    text-transform:uppercase;
                    color:#9E978C;
                  "
                >
                  Secure Institutional Access
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:38px 34px 34px;">
                <div
                  style="
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:10px;
                    letter-spacing:2.2px;
                    text-transform:uppercase;
                    color:#857E72;
                  "
                >
                  ${contextLabel}
                </div>

                <h1
                  style="
                    margin:12px 0 18px;
                    font-family:Georgia,'Times New Roman',serif;
                    font-size:31px;
                    line-height:1.12;
                    font-weight:400;
                    color:#181714;
                  "
                >
                  ${heading}
                </h1>

                <p
                  style="
                    margin:0;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:14px;
                    line-height:1.75;
                    color:#5A554D;
                  "
                >
                  ${instruction}
                </p>

                <div
                  style="
                    margin:28px 0;
                    padding:24px 18px;
                    border-top:1px solid #BDB5A7;
                    border-bottom:1px solid #BDB5A7;
                    text-align:center;
                    font-family:'Courier New',monospace;
                    font-size:34px;
                    font-weight:700;
                    letter-spacing:.26em;
                    color:#181714;
                  "
                >
                  ${pin}
                </div>

                <div
                  style="
                    background:#1B1915;
                    padding:20px 22px;
                  "
                >
                  <div
                    style="
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:9px;
                      letter-spacing:2px;
                      text-transform:uppercase;
                      color:#BDB5A6;
                    "
                  >
                    Short-Lived Verification
                  </div>

                  <p
                    style="
                      margin:10px 0 0;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:12px;
                      line-height:1.7;
                      color:#D7D0C4;
                    "
                  >
                    This code expires in
                    ${input.expiresInMinutes} minutes.
                    ${securityNote}
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  border-top:1px solid #C9C1B2;
                  padding:17px 28px;
                "
              >
                <div
                  style="
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:9px;
                    letter-spacing:1.7px;
                    text-transform:uppercase;
                    color:#8A8377;
                  "
                >
                  AXPT · Controlled Access Communication
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    text,
    html,
  };
}
