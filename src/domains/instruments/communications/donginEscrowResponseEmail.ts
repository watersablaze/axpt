import "server-only";

import {
  deliverDigitalSettlementEmail,
  type DigitalSettlementDeliveryResult,
} from "./deliverDigitalSettlementEmail";
import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";

export const DONGIN_ESCROW_RESPONSE_TYPE =
  "TX_DONGIN_ESCROW_ACTIVATION_RESPONSE_20261009" as const;

export const DONGIN_ESCROW_RESPONSE_RECIPIENTS = {
  buyer: {
    role: "BUYER",
    email: "fangmoon@naver.com",
  },
  representatives: [
    {
      role: "REPRESENTATIVE_INTERMEDIARY",
      email: "michellemish67@yahoo.com",
    },
    {
      role: "REPRESENTATIVE_INTERMEDIARY",
      email: "kingchrisbo@gmail.com",
    },
    {
      role: "REPRESENTATIVE_INTERMEDIARY",
      email: "colorchoi@gmail.com",
    },
  ],
  internal: [
    {
      role: "FRENCH_WARD_INTERNAL",
      email: "frenchward938@gmail.com",
    },
    {
      role: "FRENCH_WARD_ESCROW_ATTORNEY",
      name: "Lawrence Williams",
      email: "lrwjr1@me.com",
    },
  ],
} as const;

export const DONGIN_ESCROW_RESPONSE_SUBJECT =
  "DONGIN TRADE HOLDINGS | Escrow Structure & Transaction Activation" as const;

const englishLines = [
  "Dear Mr. Bang and DONGIN Team,",
  "Thank you for the update.",
  "For clarity, the 10% Transaction Activation was not introduced after execution of the SPA. It was discussed in August through the intermediaries representing both sides and was repeatedly and expressly communicated as the requested transaction structure on which French-Ward agreed to proceed with this Buyer.",
  "We are prepared to proceed through a formal United States-based attorney escrow structure under the oversight of our qualified Escrow Attorney, Mr. Lawrence R. Williams, with the escrow banking relationship maintained through JPMorgan Chase Bank, N.A.",
  "Under this structure, the 10% Transaction Activation would be deposited into the designated attorney escrow account and administered under counsel’s oversight so that the applicable export and transaction requirements can be properly authorized and managed.",
  "Since August, the Bafoula Cooperative and Elders have been preparing for the Buyer’s transaction and preserving the allocated Gold pending settlement. French-Ward has continued to bear the associated secure-storage and holding costs throughout this period, which have now become a material and continuing carrying cost while the transaction remains pending.",
  "This structure provides the Buyer with a clear, professionally controlled U.S. banking and escrow framework while allowing the Transaction Activation to serve its intended purpose within the export process.",
  "If the Buyer agrees to proceed on this basis, French-Ward will provide the formal escrow instructions and move the transaction forward accordingly.",
  "We will also provide a concise itemization of the storage and related holding costs referenced previously.",
  "Respectfully,",
  "Jamal Ward",
  "French-Ward, Inc.",
] as const;

const koreanLines = [
  "방 대표님 및 DONGIN 팀 여러분께,",
  "업데이트해 주셔서 감사합니다.",
  "명확히 말씀드리면, 10% Transaction Activation은 SPA 체결 이후 새롭게 추가된 조건이 아닙니다. 이는 지난 8월 양측을 대표하는 중개인들을 통해 논의되었고, French-Ward가 본 Buyer와 거래를 진행하기로 한 전제이자 요청된 거래 구조로 반복적으로, 그리고 분명하게 전달되었습니다.",
  "저희는 이제 미국 기반의 정식 attorney escrow 구조를 통해 진행할 준비가 되어 있습니다. 해당 구조는 저희의 자격을 갖춘 Escrow Attorney인 Mr. Lawrence R. Williams의 관리하에 이루어지며, escrow banking relationship은 JPMorgan Chase Bank, N.A.를 통해 운영됩니다.",
  "이 구조에서는 10% Transaction Activation이 지정된 attorney escrow account로 입금되며, counsel의 관리와 감독 아래 보관 및 집행되어 필요한 export 및 transaction requirements가 적절하게 승인되고 관리될 수 있도록 합니다.",
  "지난 8월부터 Bafoula Cooperative와 Elders는 Buyer의 transaction을 준비하고, settlement를 기다리는 동안 배정된 Gold를 계속 확보하여 보관해 왔습니다. 그 기간 동안 French-Ward는 관련된 secure-storage 및 holding costs를 계속 부담해 왔으며, transaction이 여전히 미결 상태로 유지되면서 현재 이 비용은 실질적이고 지속적인 carrying cost가 되었습니다.",
  "이 구조는 Buyer에게 명확하고 전문적으로 관리되는 미국 기반 banking 및 escrow framework를 제공하는 동시에, Transaction Activation이 export process 내에서 원래 의도된 기능을 수행할 수 있도록 합니다.",
  "Buyer가 이 구조에 따라 진행하는 데 동의한다면, French-Ward는 정식 escrow instructions를 제공하고 transaction을 다음 단계로 진행하겠습니다.",
  "또한 이전에 언급한 storage 및 관련 holding costs에 대해서도 간결한 항목별 내역을 제공하겠습니다.",
  "감사합니다.",
  "Jamal Ward",
  "French-Ward, Inc.",
] as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderParagraphs(lines: readonly string[]) {
  return lines
    .map((line, index) => {
      const isSignature =
        index >= lines.length - 3;

      return `
        <p
          style="
            margin:0 0 ${isSignature ? "4px" : "16px"};
            color:${isSignature ? "#e6e1d7" : "#c7c2b8"};
            font-size:14px;
            line-height:1.7;
            ${isSignature ? "font-weight:600;" : ""}
          "
        >
          ${escapeHtml(line)}
        </p>
      `;
    })
    .join("");
}

function renderEmail() {
  const english = renderParagraphs(englishLines);
  const korean = renderParagraphs(koreanLines);

  return `<!doctype html>
<html>
  <body
    style="
      margin:0;
      padding:0;
      background:#07110d;
      color:#ebe7dd;
      font-family:Arial,Helvetica,sans-serif;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="background:#07110d;"
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
              max-width:680px;
              border:1px solid #303b35;
              background:#0b1511;
            "
          >
            <tr>
              <td
                style="
                  padding:28px 30px 18px;
                  border-top:2px solid #b99657;
                "
              >
                <p
                  style="
                    margin:0 0 12px;
                    color:#b99657;
                    font-size:9px;
                    font-weight:700;
                    letter-spacing:.18em;
                    text-transform:uppercase;
                  "
                >
                  French-Ward · Transaction Correspondence
                </p>

                <p
                  style="
                    margin:0 0 7px;
                    color:#738078;
                    font-size:10px;
                    letter-spacing:.1em;
                    text-transform:uppercase;
                  "
                >
                  DONGIN TRADE HOLDINGS
                </p>

                <h1
                  style="
                    margin:0;
                    color:#f0ece2;
                    font-size:24px;
                    line-height:1.25;
                    font-weight:500;
                  "
                >
                  Escrow Structure &amp; Transaction Activation
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 30px 0;">
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    border-top:1px solid #39443f;
                    border-bottom:1px solid #39443f;
                  "
                >
                  <tr>
                    <td style="padding:14px 0;">
                      <p
                        style="
                          margin:0 0 5px;
                          color:#758078;
                          font-size:9px;
                          letter-spacing:.14em;
                          text-transform:uppercase;
                        "
                      >
                        Proposed Settlement Structure
                      </p>
                      <p
                        style="
                          margin:0;
                          color:#d7b76e;
                          font-size:14px;
                          font-weight:600;
                          letter-spacing:.02em;
                        "
                      >
                        U.S.-BASED ATTORNEY ESCROW · JPMORGAN CHASE BANK, N.A.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 30px 30px;">
                ${english}

                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="margin:30px 0 26px;"
                >
                  <tr>
                    <td
                      style="
                        border-top:1px solid #39443f;
                        padding-top:18px;
                      "
                    >
                      <p
                        style="
                          margin:0;
                          color:#b99657;
                          font-size:9px;
                          font-weight:700;
                          letter-spacing:.16em;
                          text-transform:uppercase;
                        "
                      >
                        Korean Translation · 한국어 번역
                      </p>
                    </td>
                  </tr>
                </table>

                ${korean}
              </td>
            </tr>

            <tr>
              <td
                style="
                  border-top:1px solid #303b35;
                  padding:18px 30px 22px;
                "
              >
                <p
                  style="
                    margin:0 0 4px;
                    color:#d8d4cb;
                    font-size:11px;
                    font-weight:600;
                  "
                >
                  French-Ward, Inc.
                </p>
                <p
                  style="
                    margin:0;
                    color:#66736d;
                    font-size:9px;
                    letter-spacing:.1em;
                    text-transform:uppercase;
                  "
                >
                  Governed through AXPT
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildDonginEscrowResponseEmail() {
  const copiedRecipients = [
    ...DONGIN_ESCROW_RESPONSE_RECIPIENTS.representatives.map(
      (recipient) => recipient.email,
    ),
    ...DONGIN_ESCROW_RESPONSE_RECIPIENTS.internal.map(
      (recipient) => recipient.email,
    ),
  ];

  return {
    type: DONGIN_ESCROW_RESPONSE_TYPE,
    from: getDigitalSettlementSender(),
    to: DONGIN_ESCROW_RESPONSE_RECIPIENTS.buyer.email,
    cc: copiedRecipients,
    subject: DONGIN_ESCROW_RESPONSE_SUBJECT,
    heading: "Escrow Structure & Transaction Activation",
    communicationType: "COUNTERPARTY_ESCROW_RESPONSE",
    englishLines,
    koreanLines,
    text: [
      ...englishLines,
      "",
      "Korean Translation · 한국어 번역",
      "",
      ...koreanLines,
    ].join("\n"),
    html: renderEmail(),
    deliveryMode: getDigitalSettlementEmailMode(),
  } as const;
}

export async function sendDonginEscrowResponseEmail(): Promise<
  DigitalSettlementDeliveryResult
> {
  const message = buildDonginEscrowResponseEmail();

  return deliverDigitalSettlementEmail({
    type: message.type,
    to: message.to,
    cc: message.cc,
    subject: message.subject,
    text: message.text,
    html: message.html,
    rawPayload: {
      communicationKey: DONGIN_ESCROW_RESPONSE_TYPE,
      communicationType: message.communicationType,
      counterparty: "DONGIN TRADE HOLDINGS",
      recipients: {
        buyer: DONGIN_ESCROW_RESPONSE_RECIPIENTS.buyer,
        representatives:
          DONGIN_ESCROW_RESPONSE_RECIPIENTS.representatives,
        internal:
          DONGIN_ESCROW_RESPONSE_RECIPIENTS.internal,
      },
      escrowStructure: {
        jurisdiction: "United States",
        attorney: "Lawrence R. Williams",
        bankingInstitution: "JPMorgan Chase Bank, N.A.",
      },
      bilingual: true,
      languages: ["en", "ko"],
    },
  });
}
