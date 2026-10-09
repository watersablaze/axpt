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
    {
      role: "REPRESENTATIVE_INTERMEDIARY",
      email: "onesimuskufazvineyi4@gmail.com",
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
  "DONGIN TRADE HOLDINGS | U.S. Escrow Structure & Transaction Activation" as const;

const englishLines = [
  "Dear Mr. Bang and DONGIN Team,",
  "Thank you for the update and for presenting the escrow proposal.",
  "For clarity, the 10% Transaction Activation was not introduced by French-Ward after execution of the SPA. Prior to execution, the Buyer-side representative, acting on behalf of the Buyer, communicated the Buyer’s request to proceed with an initial 10% USDT payment structure. French-Ward agreed to accommodate that request as part of the Transaction. Following execution, the Buyer side separately requested additional time, through the end of August, to prepare the already-discussed 10% Transaction Activation, and French-Ward accommodated that request as well.",
  "We can accommodate the Buyer’s escrow request through a formal United States-based attorney escrow structure under the oversight of our qualified Escrow Attorney, Mr. Lawrence R. Williams, with JPMorgan Chase Bank, N.A. serving as the U.S. banking institution for the escrow account.",
  "We do, however, need to clarify one material point regarding the Buyer’s proposal. French-Ward cannot agree that the 10% Transaction Activation remain restricted in escrow until refining, inspection, and payment of the final balance are completed. The 10% is not structured as a post-refining security deposit. Its purpose is to activate the Transaction and support the documented pre-export process and requirements applicable to the transaction in Mali.",
  "Accordingly, the Buyer may place the 10% Transaction Activation into the designated United States attorney escrow account, but upon confirmed receipt, those funds must be available for immediate release and administration by counsel for the Transaction Activation and the applicable Mali-side pre-export requirements. The escrow structure provides the Buyer with independent U.S. legal and banking oversight; it does not alter the purpose or timing of the Transaction Activation.",
  "This is not a discretionary preference being imposed by French-Ward. It reflects the documented transaction structure and Mali-side pre-export requirements that have already been provided to the Buyer. We recognize the Buyer’s caution arising from prior experiences unrelated to this Transaction, and the attorney escrow structure is intended to provide additional protection and institutional clarity without preventing the Transaction Activation from performing its required function.",
  "Since August, the Bafoula Cooperative and Elders have been preparing for the Buyer’s transaction and preserving the allocated 50 KG pending settlement. French-Ward has continued to bear the associated secure-storage, security, and holding costs throughout this period. These costs continue to accrue as a material carrying burden while the Buyer’s allocation remains reserved.",
  "Upon the Buyer’s confirmation that this escrow structure is acceptable on that basis, French-Ward will provide the formal attorney escrow instructions and proceed accordingly. We will also provide the requested itemization of storage, security, and related holding costs.",
  "If the Buyer accepts this structure, French-Ward will proceed with the formal escrow instructions and the remaining transaction steps. If the Buyer does not proceed on this basis, French-Ward will formally close the Transaction, record the circumstances and basis for closure, complete the appropriate cancellation and custodial documentation, and preserve the complete transaction record.",
  "Respectfully,",
  "Jamal Ward",
  "French-Ward, Inc.",
] as const;

const koreanLines = [
  "방 대표님 및 DONGIN 팀 여러분께,",
  "업데이트와 에스크로 제안을 전달해 주셔서 감사합니다.",
  "명확히 말씀드리면, 10% Transaction Activation은 SPA 체결 이후 French-Ward가 새롭게 제시한 조건이 아닙니다. SPA 체결 이전에 Buyer 측 대표가 Buyer를 대신하여 초기 10% USDT 지급 구조로 진행하고자 하는 Buyer의 요청을 전달하였고, French-Ward는 해당 요청을 거래 구조의 일부로 수용했습니다. 이후 SPA 체결 후에는 Buyer 측에서 이미 논의된 10% Transaction Activation을 준비하기 위해 8월 말까지 추가 시간을 요청하였으며, French-Ward는 그 요청 역시 수용했습니다.",
  "저희는 자격을 갖춘 Escrow Attorney인 Mr. Lawrence R. Williams의 감독하에, JPMorgan Chase Bank, N.A.를 미국 내 금융기관으로 하는 정식 미국 기반 attorney escrow 구조를 통해 Buyer의 escrow 요청을 수용할 수 있습니다.",
  "다만 Buyer가 제안한 구조와 관련하여 한 가지 중요한 사항을 명확히 할 필요가 있습니다. French-Ward는 10% Transaction Activation이 refining, inspection 및 final balance 지급이 모두 완료될 때까지 escrow에 제한된 상태로 남아 있는 구조에는 동의할 수 없습니다. 10% Transaction Activation은 정제 이후를 위한 security deposit으로 설계된 것이 아닙니다. 그 목적은 Transaction을 실제로 활성화하고, Mali에서 이 거래에 적용되는 문서화된 수출 전 절차와 요건이 진행될 수 있도록 하는 것입니다.",
  "따라서 Buyer는 10% Transaction Activation을 지정된 미국 attorney escrow account에 예치할 수 있습니다. 그러나 입금이 확인되는 즉시 해당 자금은 counsel의 감독하에 Transaction Activation 및 Mali 측의 적용 가능한 수출 전 요건을 위해 즉시 release 및 administration이 가능해야 합니다. 이 escrow 구조는 Buyer에게 독립적인 미국 법률 및 금융 감독 체계를 제공하기 위한 것이며, Transaction Activation의 목적이나 시점을 변경하기 위한 것이 아닙니다.",
  "이는 French-Ward가 임의로 요구하는 조건이 아닙니다. 이미 Buyer에게 제공된 문서화된 거래 구조와 Mali 측 수출 전 요건을 반영하는 것입니다. 저희는 Buyer가 본 Transaction과 무관한 과거 경험으로 인해 신중한 입장을 취하고 있다는 점을 이해하고 있으며, 이번 attorney escrow 구조는 Transaction Activation의 본래 기능을 방해하지 않으면서도 Buyer에게 추가적인 보호와 제도적 명확성을 제공하기 위한 것입니다.",
  "지난 8월부터 Bafoula Cooperative와 Elders는 Buyer의 transaction을 준비하고 settlement를 기다리는 동안 배정된 50 KG 물량을 계속 확보하여 보관해 왔습니다. French-Ward는 이 기간 동안 관련된 secure-storage, security 및 holding costs를 계속 부담해 왔습니다. 이러한 비용은 Buyer를 위해 해당 물량이 계속 확보되어 있는 동안 지속적으로 누적되고 있으며, 현재 French-Ward가 부담하는 실질적인 유지 비용이 되고 있습니다.",
  "Buyer가 본 escrow 구조를 이러한 기준으로 수용한다는 확인을 주는 즉시 French-Ward는 정식 attorney escrow instructions를 제공하고 그에 따라 진행하겠습니다. 또한 요청하신 storage, security 및 관련 holding costs에 대한 항목별 내역도 제공하겠습니다.",
  "Buyer가 본 구조를 수용하는 경우, French-Ward는 정식 escrow instructions와 나머지 거래 절차를 진행하겠습니다. Buyer가 본 기준으로 진행하지 않는 경우, French-Ward는 Transaction을 정식으로 종료하고, 종료의 경위와 근거를 기록하며, 필요한 cancellation 및 custodial documentation을 완료하고, 전체 transaction record를 보존하겠습니다.",
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
            color:${isSignature ? "#181411" : "#2a241f"};
            font-size:14px;
            line-height:1.7;
            font-weight:${isSignature ? "700" : "500"};
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
      background:#efe6d5;
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
      style="background:#efe6d5;"
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
              border:1px solid #c8b79f;
              background:#f8f1e5;
            "
          >
            <tr>
              <td
                style="
                  padding:28px 30px 18px;
                  border-top:3px solid #9f7837;
                  background:#eadcc4;
                "
              >
                <p
                  style="
                    margin:0 0 12px;
                    color:#9f7837;
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
                    color:#49604d;
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
                    color:#171411;
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
              <td style="padding:8px 30px 0;background:#f0e5d3;">
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    border-top:1px solid #c2ae91;
                    border-bottom:1px solid #c2ae91;
                  "
                >
                  <tr>
                    <td style="padding:14px 0;">
                      <p
                        style="
                          margin:0 0 5px;
                          color:#526b57;
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
                          color:#ad8440;
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
                  style="margin:36px 0 30px;"
                >
                  <tr>
                    <td
                      style="
                        border-top:1px solid #c2ae91;
                        padding-top:18px;
                      "
                    >
                      <p
                        style="
                          margin:0;
                          color:#9f7837;
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
                  border-top:1px solid #c8b79f;
                  padding:18px 30px 22px;
                  background:#dce4dc;
                "
              >
                <p
                  style="
                    margin:0 0 4px;
                    color:#211c18;
                    font-size:11px;
                    font-weight:600;
                  "
                >
                  French-Ward, Inc.
                </p>
                <p
                  style="
                    margin:0;
                    color:#526557;
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
