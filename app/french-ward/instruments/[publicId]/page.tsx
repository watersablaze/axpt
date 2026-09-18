import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { InstrumentShell } from "@/components/instruments/InstrumentShell";
import { CopySettlementAddress } from "@/components/instruments/digital-settlement/CopySettlementAddress";
import { instrumentAccessCookieName } from "@/domains/instruments/access/accessToken";
import { DIGITAL_SETTLEMENT_STATUS } from "@/domains/instruments/contracts";
import {
  HINES_DSI_REFERENCE,
  INDERAKSH_BUYER_SUBMISSION,
} from "@/domains/instruments/definitions/hinesDigitalSettlementV1Definition";
import { loadIssuedDigitalSettlementInstruction } from "@/domains/instruments/queries/loadIssuedDigitalSettlementInstruction";
import { resolveInstrumentAccess } from "@/domains/instruments/queries/resolveInstrumentAccess";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<{ previewState?: string }>;
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function addressFingerprint(address: string) {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "French-Ward Digital Settlement Instruction | AXPT",
    description:
      "Transaction-specific digital settlement coordinates issued by French-Ward, Inc.",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

function createPreviewInstruction(state: string | undefined) {
  const principalAuthorized = state === "principal-authorized";
  const verificationConfirmed =
    principalAuthorized || state === "verification-confirmed";

  return {
    publicId: "__preview__",
    reference: "FW-DSI-2026-001",
    title: "Digital Settlement Instruction",
    versionNumber: 1,
    issuedAt: new Date("2026-09-17T00:00:00.000Z"),
    counterpartyName: "Inderaksh Gold Refinery FZ-LLC",
    counterpartyRepresentative: "Corey Keller, Vice President",
    commodity: "Au Dore Bars",
    transactionDescription: "Initial 50 KG Au Dore Bars Shipment",
    settlementPurpose:
      "7.5% good-faith transaction activation for the initial 50 KG shipment, calculated from the purchase price",
    proceduralBasis:
      "French-Ward has authorized this transaction-specific good-faith pre-SPA procedure based on the buyer submission and supplemental commercial direction. The signed LOI supports buyer identity and the proposed transaction profile but does not itself establish the pricing calculation or settlement obligation shown here. Receipt does not replace, execute, or amend the SPA and does not constitute commodity allocation.",
    quantityKg: "50",
    pricingStatus: "FIXED",
    pricingBasis: "LBMA Gold Price PM less 10%",
    spotDiscountPercentage: "10",
    spotBenchmark:
      "LBMA Gold Price PM — 2026-09-17 — USD 4,368.10 per troy ounce",
    spotPricePerKgUsd: "140437.68",
    pricePerKgUsd: "126393.91",
    transactionValueUsd: "6319695.50",
    settlementPercentage: "7.5",
    settlementAmountUsd: "473977.16",
    priceFixedAt: new Date("2026-09-17T00:08:00.000Z"),
    settlementAsset: "USDT",
    settlementNetwork: "ETHEREUM_ERC20",
    receivingEntity: "French-Ward, Inc.",
    receivingAddress: "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",
    receivingWalletId: "axpt-operations",
    receivingWalletRole: "operations",
    verificationAmountUsdt: "50",
    verificationTxHash: verificationConfirmed ? `0x${"ab".repeat(32)}` : null,
    verificationConfirmedAt: verificationConfirmed
      ? new Date("2026-09-17T00:05:00.000Z")
      : null,
    principalAuthorizedAt: principalAuthorized
      ? new Date("2026-09-17T00:10:00.000Z")
      : null,
    settlementStatus: principalAuthorized
      ? DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER
      : verificationConfirmed
        ? DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED
        : DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER,
  } as const;
}

export default async function DigitalSettlementInstructionPage({
  params,
  searchParams,
}: PageProps) {
  const { publicId } = await params;
  const { previewState } = (await searchParams) ?? {};
  const isVisualPreview =
    publicId === "__preview__" &&
    (process.env.NODE_ENV !== "production" ||
      process.env.VERCEL_ENV === "preview");

  let instruction;

  if (isVisualPreview) {
    instruction = createPreviewInstruction(previewState);
  } else {
    const token = (await cookies()).get(
      instrumentAccessCookieName(publicId),
    )?.value;

    if (!token) {
      notFound();
    }

    const access = await resolveInstrumentAccess({
      publicId,
      token,
    });

    if (!access) {
      notFound();
    }

    instruction = await loadIssuedDigitalSettlementInstruction(publicId);
  }

  if (!instruction) {
    notFound();
  }

  const qrCode = await QRCode.toDataURL(instruction.receivingAddress, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#111714",
      light: "#e8e0cc",
    },
  });

  const verificationOnly =
    instruction.settlementStatus ===
    DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER;
  const verificationConfirmed =
    instruction.settlementStatus ===
    DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED;
  const principalAuthorized = instruction.principalAuthorizedAt !== null;
  const principalTransferActive =
    principalAuthorized &&
    [
      DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER,
      DIGITAL_SETTLEMENT_STATUS.DETECTED,
      DIGITAL_SETTLEMENT_STATUS.CONFIRMING,
      DIGITAL_SETTLEMENT_STATUS.CONFIRMED,
    ].includes(instruction.settlementStatus);
  const verificationAmount = Number(instruction.verificationAmountUsdt);
  const pricingFixed = instruction.pricingStatus === "FIXED";
  const buyerSubmission =
    instruction.reference === HINES_DSI_REFERENCE
      ? INDERAKSH_BUYER_SUBMISSION
      : null;
  const remainingSettlementUsdt = instruction.settlementAmountUsd
    ? `${(
        Number(instruction.settlementAmountUsd) - verificationAmount
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USDT`
    : null;

  const movements = [
    { index: "01", label: "Buyer Submission", active: true },
    { index: "02", label: "Commercial Basis" },
    { index: "03", label: "Settlement Coordinates" },
    { index: "04", label: "Recognition Standard" },
  ];

  return (
    <InstrumentShell
      eyebrow="French-Ward / Controlled Settlement Instrument"
      title="Digital Settlement Instruction"
      subtitle="Transaction-Specific Receiving Coordinates"
      reference={instruction.reference}
      version={`V${instruction.versionNumber}`}
      status={isVisualPreview ? "VISUAL REVIEW" : "ISSUED"}
      movements={movements}
      classificationLabel={
        isVisualPreview
          ? "Synthetic Visual Review Fixture"
          : "Authorized Settlement Instrument"
      }
      showStatusRail={false}
    >
      {isVisualPreview ? (
        <section className={styles.previewNotice} aria-label="Preview notice">
          Synthetic visual-review fixture. No displayed party, amount, QR code,
          or address carries settlement authority. Do not transmit value.
        </section>
      ) : null}

      <section className={styles.intro} aria-labelledby="instruction-heading">
        <div>
          <p className={styles.kicker}>Authorized instruction</p>
          <h2 id="instruction-heading">
            Verify the obligation before transmitting value.
          </h2>
        </div>
        <dl className={styles.statusPair}>
          <div>
            <dt>Instruction</dt>
            <dd>Issued</dd>
          </div>
          <div>
            <dt>Settlement</dt>
            <dd>{formatStatus(instruction.settlementStatus)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.authorityBand} aria-label="Transfer authority">
        {verificationOnly ? (
          <>
            <p>Current transfer authority</p>
            <h2>Verification transfer only — {verificationAmount} USDT</h2>
            <p>
              Do not transmit the principal settlement amount. The verification
              transfer will be credited toward the total settlement obligation.
              French-Ward must confirm receipt and separately authorize the
              principal transfer.
            </p>
          </>
        ) : verificationConfirmed && !principalAuthorized ? (
          <>
            <p>Current transfer authority</p>
            <h2>Verification confirmed — principal transfer paused</h2>
            <p>
              Do not transmit the remaining settlement amount until French-Ward
              records the price fixing and a separate principal-transfer
              authorization.
            </p>
          </>
        ) : principalTransferActive ? (
          <>
            <p>Current transfer authority</p>
            <h2>Principal transfer authorized</h2>
            <p>
              The verified {verificationAmount} USDT is credited toward the
              obligation. The remaining authorized settlement amount is{" "}
              {remainingSettlementUsdt ?? "not available"}.
            </p>
          </>
        ) : (
          <>
            <p>Current transfer authority</p>
            <h2>No transfer presently authorized</h2>
            <p>
              Pause transmission and request a current instruction from
              French-Ward before sending any value.
            </p>
          </>
        )}
      </section>

      {buyerSubmission ? (
        <section className={styles.panel} aria-labelledby="submission-heading">
          <div className={styles.sectionHeading}>
            <span>01</span>
            <div>
              <p>Buyer submission</p>
              <h2 id="submission-heading">
                Identity received. Authority kept in scope.
              </h2>
            </div>
          </div>

          <dl className={styles.submissionGrid}>
            <div>
              <dt>Submission</dt>
              <dd>{buyerSubmission.documentTitle}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>
                {buyerSubmission.submittedAt.toLocaleDateString("en-US", {
                  dateStyle: "long",
                  timeZone: "UTC",
                })}
              </dd>
            </div>
            <div>
              <dt>Representative authority</dt>
              <dd>{buyerSubmission.authorityScope}</dd>
            </div>
            <div>
              <dt>Proposed transaction profile</dt>
              <dd>{buyerSubmission.transactionProfile}</dd>
            </div>
            <div>
              <dt>Supporting records</dt>
              <dd>{buyerSubmission.recordsOnFile}</dd>
            </div>
          </dl>

          <p className={styles.evidenceBoundary}>
            {buyerSubmission.evidenceBoundary}
          </p>
        </section>
      ) : null}

      <section className={styles.panel} aria-labelledby="commercial-heading">
        <div className={styles.sectionHeading}>
          <span>02</span>
          <div>
            <p>Commercial basis</p>
            <h2 id="commercial-heading">
              The obligation captured at issuance.
            </h2>
          </div>
        </div>

        <dl className={styles.commercialGrid}>
          <div>
            <dt>Counterparty</dt>
            <dd>{instruction.counterpartyName}</dd>
          </div>
          {instruction.counterpartyRepresentative ? (
            <div>
              <dt>Represented by</dt>
              <dd>{instruction.counterpartyRepresentative}</dd>
            </div>
          ) : null}
          <div>
            <dt>Commodity</dt>
            <dd>{instruction.commodity}</dd>
          </div>
          <div>
            <dt>Transaction</dt>
            <dd>{instruction.transactionDescription}</dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd>{Number(instruction.quantityKg).toLocaleString()} KG</dd>
          </div>
          <div>
            <dt>Purchase price basis</dt>
            <dd>{instruction.pricingBasis}</dd>
          </div>
          <div>
            <dt>Price fixing</dt>
            <dd>
              {pricingFixed && instruction.spotBenchmark
                ? instruction.spotBenchmark
                : "Pending approved spot benchmark"}
            </dd>
          </div>
          <div>
            <dt>Purchase price per KG</dt>
            <dd>
              {instruction.pricePerKgUsd
                ? usd.format(Number(instruction.pricePerKgUsd))
                : "Pending price fixing"}
            </dd>
          </div>
          <div>
            <dt>Transaction value</dt>
            <dd>
              {instruction.transactionValueUsd
                ? usd.format(Number(instruction.transactionValueUsd))
                : "Pending price fixing"}
            </dd>
          </div>
          <div className={styles.emphasis}>
            <dt>Good-faith activation</dt>
            <dd>
              {instruction.settlementPercentage}% ·{" "}
              {instruction.settlementAmountUsd
                ? usd.format(Number(instruction.settlementAmountUsd))
                : "Amount pending price fixing"}
            </dd>
          </div>
        </dl>

        <p className={styles.purpose}>{instruction.settlementPurpose}</p>
        <p className={styles.purpose}>{instruction.proceduralBasis}</p>
      </section>

      <section className={styles.panel} aria-labelledby="coordinates-heading">
        <div className={styles.sectionHeading}>
          <span>03</span>
          <div>
            <p>Settlement coordinates</p>
            <h2 id="coordinates-heading">One authorized destination.</h2>
          </div>
        </div>

        <div className={styles.coordinateGrid}>
          <div className={styles.coordinateData}>
            <dl>
              <div>
                <dt>Asset</dt>
                <dd>{instruction.settlementAsset}</dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>Ethereum (ERC-20)</dd>
              </div>
              <div>
                <dt>Receiving authority</dt>
                <dd>{instruction.receivingEntity}</dd>
              </div>
              <div>
                <dt>Wallet function</dt>
                <dd>Controlled settlement ingress</dd>
              </div>
            </dl>

            <div className={styles.addressBlock}>
              <p>Authorized receiving address</p>
              <code>{instruction.receivingAddress}</code>
              <div className={styles.addressActions}>
                <CopySettlementAddress address={instruction.receivingAddress} />
                <span>
                  Fingerprint {addressFingerprint(instruction.receivingAddress)}
                </span>
              </div>
            </div>
          </div>

          <figure className={styles.qr}>
            {/* The generated data URL contains only the issued public address. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCode}
              alt="QR code for the authorized receiving address"
            />
            <figcaption>
              Scan only after independently verifying the network and
              fingerprint.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.standard} aria-labelledby="standard-heading">
        <div className={styles.sectionHeading}>
          <span>04</span>
          <div>
            <p>Recognition standard</p>
            <h2 id="standard-heading">Instruction is not settlement.</h2>
          </div>
        </div>

        <div className={styles.noticeGrid}>
          <p>
            This instruction identifies an authorized destination only for the
            transaction stated above. It does not alter the commercial terms of
            the underlying transaction.
          </p>
          <p>
            French-Ward recognizes settlement only after verified receipt on the
            designated network. A screenshot or transaction promise does not
            constitute confirmed receipt.
          </p>
          <p>
            No representative, intermediary, or mandate holder is authorized to
            substitute, modify, or provide an alternative receiving address.
          </p>
          <p>
            Receipt into the operational ingress wallet does not authorize
            onward movement, allocation, distribution, or long-term custody. Any
            subsequent movement requires a separately documented French-Ward
            approval.
          </p>
        </div>

        <footer className={styles.issuanceFooter}>
          <span>
            {isVisualPreview
              ? "Synthetic visual-review fixture"
              : "Issued by French-Ward, Inc."}
          </span>
          <span>
            {instruction.issuedAt.toLocaleString("en-US", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "UTC",
            })}{" "}
            UTC
          </span>
          <span>{instruction.reference}</span>
        </footer>
      </section>
    </InstrumentShell>
  );
}
