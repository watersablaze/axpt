import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { InstrumentShell } from "@/components/instruments/InstrumentShell";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin as hasAdminAccess } from "@/domains/auth/isAdmin";
import { CopySettlementAddress } from "@/components/instruments/digital-settlement/CopySettlementAddress";
import { instrumentAccessCookieName } from "@/domains/instruments/access/accessToken";
import { DIGITAL_SETTLEMENT_STATUS } from "@/domains/instruments/contracts";
import {
  createDigitalSettlementV1Definition,
  DSI_APPROVED_ISSUANCE_PRICING,
  DSI_REFERENCE,
  INDERAKSH_BUYER_SUBMISSION,
  INDERAKSH_LEGAL_NAME,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { TREASURY_WALLETS } from "@/lib/treasury/config";
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

function createPreviewInstruction() {
  const definition =
    createDigitalSettlementV1Definition(
      INDERAKSH_LEGAL_NAME,
    );

  const operationsWallet =
    TREASURY_WALLETS.find(
      (wallet) => wallet.role === "operations",
    );

  if (!operationsWallet) {
    throw new Error(
      "[DSI_PREVIEW_OPERATIONS_WALLET_NOT_CONFIGURED]",
    );
  }

  return {
    publicId: "__preview__",
    reference: definition.instrument.reference,
    title: definition.instrument.title,
    versionNumber: definition.version.number,
    issuedAt: new Date(),
    counterpartyName:
      definition.settlement.counterpartyName,
    counterpartyRepresentative:
      definition.settlement.counterpartyRepresentative,
    commodity:
      definition.settlement.commodity,
    transactionDescription:
      definition.settlement.transactionDescription,
    settlementPurpose:
      definition.settlement.settlementPurpose,
    proceduralBasis:
      definition.settlement.proceduralBasis,
    quantityKg:
      definition.settlement.quantityKg,
    pricingStatus: "FIXED",
    pricingBasis:
      definition.settlement.pricingBasis,
    spotDiscountPercentage:
      definition.settlement.spotDiscountPercentage,
    spotBenchmark:
      DSI_APPROVED_ISSUANCE_PRICING.spotBenchmark,
    spotPricePerKgUsd:
      DSI_APPROVED_ISSUANCE_PRICING.spotPricePerKgUsd,
    pricePerKgUsd:
      DSI_APPROVED_ISSUANCE_PRICING.pricePerKgUsd,
    transactionValueUsd:
      DSI_APPROVED_ISSUANCE_PRICING.transactionValueUsd,
    settlementPercentage:
      definition.settlement.settlementPercentage,
    settlementAmountUsd:
      DSI_APPROVED_ISSUANCE_PRICING.settlementAmountUsd,
    priceFixedAt: new Date("2026-09-17T15:00:00.000Z"),
    settlementAsset:
      definition.settlement.settlementAsset,
    settlementNetwork:
      definition.settlement.settlementNetwork,
    receivingEntity:
      definition.settlement.receivingEntity,
    receivingAddress:
      operationsWallet.address,
    receivingWalletId:
      operationsWallet.id,
    receivingWalletRole:
      operationsWallet.role,
    verificationAmountUsdt:
      definition.settlement.verificationAmountUsdt,
    verificationTxHash: null,
    verificationConfirmedAt: null,
    principalAuthorizedAt: null,
    settlementStatus:
      DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER,
  } as const;
}

export default async function DigitalSettlementInstructionPage({
  params,
  searchParams,
}: PageProps) {
  const { publicId } = await params;
  await searchParams;

  const previewRequested =
    publicId === "__preview__";

  let isVisualPreview = false;

  if (previewRequested) {
    const principal = await getPrincipal();

    if (!principal || !hasAdminAccess(principal)) {
      notFound();
    }

    isVisualPreview = true;
  }

  let instruction;

  if (isVisualPreview) {
    instruction = createPreviewInstruction();
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
    instruction.reference === DSI_REFERENCE
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
      subtitle="Good-Faith TAP / Transaction-Specific Receiving Coordinates"
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
      density="compact"
    >
      {isVisualPreview ? (
        <section className={styles.previewNotice} aria-label="Preview notice">
          Operator-only buyer-view preview. This renders the canonical initial
          issuance state but carries no settlement authority. No instrument,
          private access grant, or buyer authorization has been created. Do not
          transmit value.
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
              Do not transmit the remaining TAP amount. The verification
              transfer will be credited toward the total TAP obligation.
              French-Ward must confirm receipt and separately authorize the TAP
              balance.
            </p>
          </>
        ) : verificationConfirmed && !principalAuthorized ? (
          <>
            <p>Current transfer authority</p>
            <h2>Verification confirmed — TAP balance paused</h2>
            <p>
              Do not transmit the remaining TAP amount until French-Ward issues
              a separate TAP-balance authorization.
            </p>
          </>
        ) : principalTransferActive ? (
          <>
            <p>Current transfer authority</p>
            <h2>TAP balance authorized</h2>
            <p>
              The verified {verificationAmount} USDT is credited toward the TAP.
              The remaining authorized TAP amount is{" "}
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
            <dt>Good-Faith TAP</dt>
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

            <p className={styles.axptBoundary}>
              AXPT governs this authorization instruction and its recorded
              transaction state. The buyer initiates the USDT transfer from its
              own wallet or provider to the address shown; AXPT does not execute
              the blockchain transfer on the buyer&apos;s behalf.
            </p>
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
        <div className={`${styles.sectionHeading} ${styles.standardHeading}`}>
          <span>04</span>
          <div>
            <p>Recognition standard</p>
            <h2 id="standard-heading">One controlled receiving standard.</h2>
          </div>
        </div>

        <p className={styles.recognitionStatement}>
          This instruction identifies the sole authorized receiving destination
          for the transaction stated above and does not alter its commercial
          terms. No representative, intermediary, or mandate holder is
          authorized to substitute, modify, or provide an alternative receiving
          address.
        </p>

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
