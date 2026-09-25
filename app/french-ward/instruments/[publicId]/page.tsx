import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
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
import {
  DSI_V2_FINANCIER_REVISION,
  DSI_V2_VERSION,
} from "@/domains/instruments/definitions/digitalSettlementV2FinancierRevision";
import {
  INDERAKSH_TRANSACTION_CONTINUITY,
} from "@/domains/instruments/definitions/inderakshTransactionContinuity";
import { loadIssuedDigitalSettlementInstruction } from "@/domains/instruments/queries/loadIssuedDigitalSettlementInstruction";
import { resolveInstrumentAccess } from "@/domains/instruments/queries/resolveInstrumentAccess";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<{
    previewState?: string;
    previewMode?: string;
    version?: string;
    view?: string;
  }>;
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

const SYNTHETIC_PREVIEW_RECEIVING_ADDRESS =
  "0x000000000000000000000000000000000000dEaD" as const;

const SYNTHETIC_PREVIEW_WALLET_ID =
  "__synthetic_preview_wallet__" as const;

function canRenderSyntheticPreviewWithoutSession(hostname: string) {
  const normalizedHost = hostname.toLowerCase();

  return (
    process.env.NODE_ENV === "development" ||
    (
      normalizedHost.endsWith(".vercel.app") &&
      normalizedHost.includes("-git-")
    )
  );
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

function createPreviewInstruction(version: 1 | 2) {
  const definition = createDigitalSettlementV1Definition(INDERAKSH_LEGAL_NAME);

  return {
    publicId: "__preview__",
    reference: definition.instrument.reference,
    title: definition.instrument.title,
    versionNumber: version,
    issuedAt: new Date(),
    counterpartyName: definition.settlement.counterpartyName,
    counterpartyRepresentative:
      definition.settlement.counterpartyRepresentative,
    commodity: definition.settlement.commodity,
    transactionDescription: definition.settlement.transactionDescription,
    settlementPurpose: definition.settlement.settlementPurpose,
    proceduralBasis: definition.settlement.proceduralBasis,
    quantityKg: definition.settlement.quantityKg,
    pricingStatus: "FIXED",
    pricingBasis: definition.settlement.pricingBasis,
    spotDiscountPercentage: definition.settlement.spotDiscountPercentage,
    spotBenchmark: DSI_APPROVED_ISSUANCE_PRICING.spotBenchmark,
    spotPricePerKgUsd: DSI_APPROVED_ISSUANCE_PRICING.spotPricePerKgUsd,
    pricePerKgUsd: DSI_APPROVED_ISSUANCE_PRICING.pricePerKgUsd,
    transactionValueUsd: DSI_APPROVED_ISSUANCE_PRICING.transactionValueUsd,
    settlementPercentage: definition.settlement.settlementPercentage,
    settlementAmountUsd: DSI_APPROVED_ISSUANCE_PRICING.settlementAmountUsd,
    priceFixedAt: new Date("2026-09-18T15:00:00.000Z"),
    settlementAsset: definition.settlement.settlementAsset,
    settlementNetwork: definition.settlement.settlementNetwork,
    receivingEntity: definition.settlement.receivingEntity,
    receivingAddress: SYNTHETIC_PREVIEW_RECEIVING_ADDRESS,
    receivingWalletId: SYNTHETIC_PREVIEW_WALLET_ID,
    receivingWalletRole: "synthetic-preview",
    verificationAmountUsdt: definition.settlement.verificationAmountUsdt,
    verificationTxHash: null,
    verificationConfirmedAt: null,
    principalAuthorizedAt: null,
    settlementStatus: DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER,
  } as const;
}

export default async function DigitalSettlementInstructionPage({
  params,
  searchParams,
}: PageProps) {
  const { publicId } = await params;
  const previewParams = await searchParams;
  const availableViews = ["overview", "documents", "settlement", "evidence", "history"] as const;
  const requestedView = previewParams?.view;
  const selectedView = availableViews.find((view) => view === requestedView) ?? "overview";
  const consolePath = `/french-ward/instruments/${encodeURIComponent(publicId)}`;

  const previewRequested = publicId === "__preview__";

  let isVisualPreview = false;
  let isBuyerViewPreview = false;
  let isV2Preview = false;

  if (previewRequested) {
    const requestHost = (await headers()).get("host") ?? "";
    const sessionlessPreviewAllowed =
      canRenderSyntheticPreviewWithoutSession(requestHost);

    if (!sessionlessPreviewAllowed) {
      const principal = await getPrincipal();

      if (!principal || !hasAdminAccess(principal)) {
        notFound();
      }
    }

    isVisualPreview = true;
    isBuyerViewPreview = previewParams?.previewMode === "buyer";
    isV2Preview = previewParams?.version === "2";
  }

  let instruction;

  if (isVisualPreview) {
    instruction = createPreviewInstruction(isV2Preview ? 2 : 1);
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

  const displaysV2Revision =
    instruction.versionNumber >= DSI_V2_VERSION;

  const verificationOnly =
    instruction.settlementStatus ===
    DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER;
  const verificationConfirmed =
    instruction.settlementStatus ===
    DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED;
  const principalAuthorized = instruction.principalAuthorizedAt !== null;
  const principalTransferActive =
    principalAuthorized &&
    new Set<string>([
      DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER,
      DIGITAL_SETTLEMENT_STATUS.DETECTED,
      DIGITAL_SETTLEMENT_STATUS.CONFIRMING,
      DIGITAL_SETTLEMENT_STATUS.CONFIRMED,
    ]).has(instruction.settlementStatus);
  const verificationAmount = Number(instruction.verificationAmountUsdt);
  const pricingFixed = instruction.pricingStatus === "FIXED";
  const buyerSubmission =
    instruction.reference === DSI_REFERENCE ? INDERAKSH_BUYER_SUBMISSION : null;
  const remainingSettlementUsdt = instruction.settlementAmountUsd
    ? `${(
        Number(instruction.settlementAmountUsd) - verificationAmount
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USDT`
    : null;

  const isInderakshTransaction = instruction.reference === DSI_REFERENCE;
  const movements = [
    { index: "01", label: "Buyer Submission", active: true },
    { index: "02", label: "Commercial Basis" },
    { index: "03", label: "Settlement Coordinates" },
    { index: "04", label: "Recognition Standard" },
  ];

  const settlementContent = (
    <>

      <section className={styles.settlementLayer} aria-labelledby="settlement-layer-heading">
        <div className={styles.settlementLayerHeader}>
          <div>
            <p className={styles.kicker}>Settlement layer</p>
            <h2 id="settlement-layer-heading">Digital Settlement Instrument</h2>
            <p>
              {instruction.reference} · continuing settlement, payment-routing,
              recognition and reconciliation authority for this Transaction.
            </p>
          </div>
          <div className={styles.settlementLayerBadge}>
            <span>{instruction.reference} · ACTIVE</span>
            <strong>{formatStatus(instruction.settlementStatus)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.intro} aria-labelledby="instruction-heading">
        <div>
          <p className={styles.kicker}>Current settlement requirement</p>
          <h2 id="instruction-heading">
            Verification Requirement
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

      <section className={styles.panel} aria-labelledby="coordinates-heading">
        <div className={styles.sectionHeading}>
          <span>03</span>
          <div>
            <p>Settlement coordinates</p>
            <h2 id="coordinates-heading">Authorized Settlement Coordinates</h2>
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

      <details className={styles.consoleDisclosure}><summary>Commercial snapshot and Buyer submission</summary>
      {buyerSubmission ? (
        <section className={styles.panel} aria-labelledby="submission-heading">
          <div className={styles.sectionHeading}>
            <span>01</span>
            <div>
              <p>Buyer submission and authority</p>
              <h2 id="submission-heading">
                Buyer Submission and Authority
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
            <p>Commercial terms</p>
            <h2 id="commercial-heading">
              Commercial Terms at Issuance
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

      </details>

      {displaysV2Revision ? <details className={styles.consoleDisclosure}><summary>Institutional financier revision</summary>
        <section className={styles.panel} aria-labelledby="revision-heading">
          <div className={styles.sectionHeading}>
            <span>V2</span>
            <div>
              <p>Institutional revision</p>
              <h2 id="revision-heading">
                Version 2 — Financier Revision
              </h2>
            </div>
          </div>

          <dl className={styles.commercialGrid}>
            <div>
              <dt>Buyer representative</dt>
              <dd>
                {DSI_V2_FINANCIER_REVISION.buyerRepresentative.name} -{" "}
                {DSI_V2_FINANCIER_REVISION.buyerRepresentative.v2Capacity}
              </dd>
            </div>
            <div className={styles.emphasis}>
              <dt>Appointed TAP financier</dt>
              <dd>
                {DSI_V2_FINANCIER_REVISION.tapFinancier.name} -{" "}
                {DSI_V2_FINANCIER_REVISION.tapFinancier.v2Capacity}
              </dd>
            </div>
            <div>
              <dt>External review participant</dt>
              <dd>
                {DSI_V2_FINANCIER_REVISION.externalReviewer.name} -{" "}
                {DSI_V2_FINANCIER_REVISION.externalReviewer.loiCapacity}
              </dd>
            </div>
            <div>
              <dt>Revision source</dt>
              <dd>
                {DSI_V2_FINANCIER_REVISION.tapFinancier.appointmentSource}
              </dd>
            </div>
          </dl>

          <p className={styles.purpose}>
            {DSI_V2_FINANCIER_REVISION.revisionBasis}
          </p>
          <p className={styles.evidenceBoundary}>
            {DSI_V2_FINANCIER_REVISION.preservationBoundary}
          </p>
        </section>
      </details> : null}


      <section className={styles.standard} aria-labelledby="standard-heading">
        <div className={`${styles.sectionHeading} ${styles.standardHeading}`}>
          <span>04</span>
          <div>
            <p>Recognition standard</p>
            <h2 id="standard-heading">Recognition Standard</h2>
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
            {isVisualPreview && !isBuyerViewPreview
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
    </>
  );

  return (
    <InstrumentShell
      eyebrow="French-Ward, Inc. / Controlled Transaction Environment"
      title={isInderakshTransaction ? "Transaction Console" : "Digital Settlement Instruction"}
      subtitle={
        isInderakshTransaction
          ? INDERAKSH_LEGAL_NAME
          : "Good-Faith Transaction Authorization Payment / Settlement Coordinates"
      }
      reference={
        isInderakshTransaction
          ? INDERAKSH_TRANSACTION_CONTINUITY.transactionReference
          : instruction.reference
      }
      version={isInderakshTransaction ? "V1" : `V${instruction.versionNumber}`}
      status={
        isVisualPreview && !isBuyerViewPreview
          ? "VISUAL REVIEW"
          : isInderakshTransaction
            ? INDERAKSH_TRANSACTION_CONTINUITY.currentState.transaction
            : "ISSUED"
      }
      movements={isInderakshTransaction ? [] : movements}
      classificationLabel={
        isVisualPreview && !isBuyerViewPreview
          ? "Synthetic Visual Review Fixture"
          : isInderakshTransaction
            ? "Private Governed Transaction Record"
            : "Authorized Settlement Instrument"
      }
      showStatusRail={false}
      density="document"
    >
      {isVisualPreview && !isBuyerViewPreview ? (
        <section className={styles.previewNotice} aria-label="Preview notice">
          Operator-only buyer-view preview. This renders the proposed
          {isV2Preview
            ? " V2 financier revision"
            : " canonical initial issuance state"}{" "}
          but carries no settlement authority. Preview deployments use a
          synthetic receiving address and do not expose live settlement
          coordinates. No instrument version, private access grant, email, or
          buyer authorization has been created. Do not transmit value.
        </section>
      ) : null}

      {isInderakshTransaction ? (
        <div className={styles.consoleLayout}>
          <nav className={styles.consoleNavigation} aria-label="Transaction workspaces">
            <p>TRANSACTION WORKSPACES</p>
            {availableViews.map((view) => (
              <Link
                key={view}
                href={`${consolePath}?view=${view}${isVisualPreview ? `&previewMode=${isBuyerViewPreview ? "buyer" : "operator"}&version=${isV2Preview ? "2" : "1"}` : ""}`}
                aria-current={selectedView === view ? "page" : undefined}
              >
                {view[0].toUpperCase() + view.slice(1)}
              </Link>
            ))}
          </nav>
          <div className={styles.consoleContent}>
            <header className={styles.consoleTopbar}>
              <div className={styles.consoleIdentity}>
                <p>FRENCH-WARD · CONTROLLED TRANSACTION ENVIRONMENT</p>
                <strong>{INDERAKSH_TRANSACTION_CONTINUITY.transactionReference}</strong>
                <span>{INDERAKSH_LEGAL_NAME} · Initial 50 KG Gold Doré</span>
              </div>
              <div className={styles.consoleStatePill}>AWAITING EXECUTION</div>
            </header>

            <div className={styles.consoleStates} aria-label="Independent transaction states">
              <span><small>DOCUMENTS</small><strong>ISSUED</strong></span>
              <span><small>EXECUTION</small><strong>AWAITING</strong></span>
              <span><small>SETTLEMENT</small><strong>ACTIVE</strong></span>
              <span><small>CURRENT ACTION</small><strong>EXECUTE AGREEMENT</strong></span>
            </div>
            {selectedView === "overview" ? (
              <section className={styles.consolePanel} aria-label="Transaction overview">
                <p className={styles.kicker}>Current action required</p>
                <h2>Confirm the Buyer signatory and execute the SPA and Commercial Schedule.</h2>
                <p>Corey Keller is named as Buyer representative. Confirm his execution authority or provide an authorized alternate before signing.</p>
                <dl className={styles.overviewGrid}>
                  <div><dt>Transaction stage</dt><dd>Agreement · awaiting execution</dd></div>
                  <div><dt>Buyer / Seller</dt><dd>{INDERAKSH_LEGAL_NAME} / French-Ward, Inc.</dd></div>
                  <div><dt>Quantity / corridor</dt><dd>50 KG · Mali → Dubai</dd></div>
                  <div><dt>Pricing reference</dt><dd>{instruction.pricingBasis}</dd></div>
                  <div><dt>SPA / Commercial Schedule</dt><dd>Issued · awaiting execution</dd></div>
                  <div><dt>DSI</dt><dd>{formatStatus(instruction.settlementStatus)}</dd></div>
                </dl>
                <h3>Most recent recorded milestones</h3>
                <p>DSI issued {instruction.issuedAt.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })} · Current settlement state: {formatStatus(instruction.settlementStatus)}.</p>
              </section>
            ) : null}
            {selectedView === "documents" ? (
              <section className={styles.consolePanel} aria-label="Governing documents">
                <p className={styles.kicker}>Governing documents</p>
                <h2>SPA and Commercial Schedule</h2>
                <div className={styles.documentRegister}>
                  {INDERAKSH_TRANSACTION_CONTINUITY.governingDocuments.filter((document) => document.kind !== "DSI").map((document) => (
                    <article key={document.reference} className={styles.documentRecord}>
                      <div><h3>{document.title}</h3><code>{document.reference}</code></div>
                      <div className={styles.documentState}>
                        <span>{document.status}</span>
                        <div className={styles.documentActions}>
                          <button type="button" disabled title="Document not yet available">View</button>
                          <button type="button" disabled title="Document not yet available">Download</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <p className={styles.evidenceBoundary}>Secure document access is pending. Contact French-Ward for the execution copies.</p>
                <details><summary>Execution and delivery clarifications</summary>
                  {INDERAKSH_TRANSACTION_CONTINUITY.transactionNotices.map((notice) => (
                    <article key={notice.label} className={styles.noticeRecord}><div><h3>{notice.label}</h3><p>{notice.body}</p></div></article>
                  ))}
                </details>
              </section>
            ) : null}
            {selectedView === "evidence" ? (
              <section className={styles.consolePanel} aria-label="Transaction evidence">
                <p className={styles.kicker}>Evidence and reconciliation</p>
                <h2>Evidence enters the governed record after operator review.</h2>
                <p>Chain observation, verification, and operator recognition are separate steps. A detected transfer does not itself authorize the TAP balance.</p>
                <dl className={styles.overviewGrid}>
                  <div><dt>Verification</dt><dd>{instruction.verificationConfirmedAt ? "Confirmed" : "Awaiting operator confirmation"}</dd></div>
                  <div><dt>TAP balance</dt><dd>{principalAuthorized ? "Authorized" : "Not authorized"}</dd></div>
                </dl>
              </section>
            ) : null}
            {selectedView === "history" ? (
              <section className={styles.consolePanel} aria-label="Transaction history">
                <p className={styles.kicker}>Transaction history</p>
                <h2>Recorded milestones</h2>
                <ol><li>DSI issued · {instruction.issuedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</li>
                  {instruction.verificationConfirmedAt ? <li>Verification confirmed · {instruction.verificationConfirmedAt.toLocaleString("en-US", { dateStyle: "medium", timeZone: "UTC" })} UTC</li> : null}
                  {instruction.principalAuthorizedAt ? <li>TAP balance authorized · {instruction.principalAuthorizedAt.toLocaleString("en-US", { dateStyle: "medium", timeZone: "UTC" })} UTC</li> : null}
                </ol>
                <p>Document execution and subsequent transaction events will appear when recorded.</p>
              </section>
            ) : null}
            {selectedView === "settlement" ? settlementContent : null}
          </div>
        </div>
      ) : null}

      {!isInderakshTransaction ? settlementContent : null}
    </InstrumentShell>
  );
}
