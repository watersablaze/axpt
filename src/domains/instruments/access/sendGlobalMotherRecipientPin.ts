import "server-only";
import { resend } from "@/infrastructure/email/client";

export async function sendGlobalMotherRecipientPin(
  email: string,
  pin: string,
) {
  const result = await resend.emails.send({
    from:
      process.env.FRENCH_WARD_EMAIL_FROM ??
      "French-Ward <french-ward@axpt.io>",
    to: email,
    subject: "Your AXPT Framework verification code",
    text: [
      "GLOBAL MOTHER · PRIVATE INSTITUTIONAL FRAMEWORK",
      "",
      "Verification code",
      "",
      `Your one-time verification code is: ${pin}`,
      "",
      "Enter this code in the browser where you opened your private Framework link.",
      "This code expires in 10 minutes. Verification opens your recipient access.",
      "",
      "If you did not request this code, no action is required.",
      "",
      "French-Ward, Inc.",
      "Institutional environment via AXPT",
    ].join("\n"),
    html: `
      <!doctype html>
      <html>
        <body
          style="
            margin: 0;
            padding: 0;
            background: #c7e0e8;
            color: #183e52;
            font-family: Arial, Helvetica, sans-serif;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="width: 100%; background: #c7e0e8;"
          >
            <tr>
              <td
                align="center"
                style="padding: 36px 18px;"
              >
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    width: 100%;
                    max-width: 620px;
                    border: 1px solid #aac8d4;
                    background: #dcecf2;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 28px 34px 25px;
                        background: #17384d;
                        border-bottom: 3px solid #ccb581;
                      "
                    >
                      <div
                        style="
                          margin: 0 0 10px;
                          color: #ccb581;
                          font-size: 11px;
                          line-height: 1.4;
                          letter-spacing: 2px;
                          text-transform: uppercase;
                        "
                      >
                        Global Mother · Private Institutional Framework
                      </div>

                      <div
                        style="
                          color: #f2eee3;
                          font-family: Georgia, 'Times New Roman', serif;
                          font-size: 30px;
                          line-height: 1.2;
                        "
                      >
                        Verification code
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 34px;
                        background: #dcecf2;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 20px;
                          color: #31586b;
                          font-size: 16px;
                          line-height: 1.65;
                        "
                      >
                        Use this one-time code to continue into your
                        private Framework access.
                      </p>

                      <div
                        style="
                          margin: 0 0 24px;
                          padding: 22px 20px;
                          border: 1px solid #adc8d4;
                          background: #edf6f9;
                          color: #173f54;
                          font-size: 32px;
                          font-weight: 700;
                          line-height: 1;
                          letter-spacing: 8px;
                          text-align: center;
                        "
                      >
                        ${pin}
                      </div>

                      <p
                        style="
                          margin: 0 0 8px;
                          color: #31586b;
                          font-size: 15px;
                          line-height: 1.65;
                        "
                      >
                        Enter this code in the browser where you opened
                        your private Framework link.
                      </p>

                      <p
                        style="
                          margin: 0 0 24px;
                          color: #48697a;
                          font-size: 13px;
                          line-height: 1.6;
                        "
                      >
                        This code expires in 10 minutes. Verification
                        opens your recipient access.
                      </p>

                      <div
                        style="
                          padding-top: 20px;
                          border-top: 1px solid #aac8d4;
                          color: #587687;
                          font-size: 12px;
                          line-height: 1.6;
                        "
                      >
                        If you did not request this code, no action is
                        required.
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 22px 34px;
                        background: #c9dee7;
                        border-top: 1px solid #aac8d4;
                      "
                    >
                      <div
                        style="
                          color: #173f54;
                          font-size: 13px;
                          font-weight: 700;
                          line-height: 1.5;
                        "
                      >
                        French-Ward, Inc.
                      </div>

                      <div
                        style="
                          margin-top: 3px;
                          color: #557586;
                          font-size: 10px;
                          line-height: 1.5;
                          letter-spacing: 1.5px;
                          text-transform: uppercase;
                        "
                      >
                        Institutional environment via AXPT
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  if (result.error) {
    throw new Error("GM_PIN_DELIVERY_FAILED");
  }
}
