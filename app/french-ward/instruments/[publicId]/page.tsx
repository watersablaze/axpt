import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { InstrumentShell } from "@/components/instruments/InstrumentShell";
import { CopySettlementAddress } from "@/components/instruments/digital-settlement/CopySettlementAddress";
import { loadIssuedDigitalSettlementInstruction } from "@/domains/instruments/queries/loadIssuedDigitalSettlementInstruction";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { publicId: string };
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const instruction = await loadIssuedDigitalSettlementInstruction(
    params.publicId,
  );

  if (!instruction) {
    return { title: "Settlement Instruction Not Available | AXPT" };
  }

  return {
    title: `${instruction.reference} | French-Ward Digital Settlement Instruction`,
    description:
      "Transaction-specific digital settlement coordinates issued by French-Ward, Inc.",
    robots: { index: false, follow: false },
  };
}

export default async function DigitalSettlementInstructionPage({
  params,
}: PageProps) {
  const instruction = await loadIssuedDigitalSettlementInstruction(
    params.publicId,
  );

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

  const movements = [
    { index: "01", label: "Commercial Basis", active: true },
    { index: "02", label: "Settlement Coordinates" },
    { index: "03", label: "Recognition Standard" },
  ];

  return (
    <InstrumentShell
      eyebrow="French-Ward / Controlled Settlement Instrument"
      title="Digital Settlement Instruction"
      subtitle="Transaction-Specific Receiving Coordinates"
      reference={instruction.reference}
      version={`V${instruction.versionNumber}`}
      status="ISSUED"
      movements={movements}
      classificationLabel="Authorized Settlement Instrument"
      showStatusRail={false}
    >
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

      <section className={styles.panel} aria-labelledby="commercial-heading">
        <div className={styles.sectionHeading}>
          <span>01</span>
          <div>
            <p>Commercial basis</p>
            <h2 id="commercial-heading">The obligation captured at issuance.</h2>
          </div>
        </div>

        <dl className={styles.commercialGrid}>
          <div>
            <dt>Counterparty</dt>
            <dd>{instruction.counterpartyName}</dd>
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
            <dt>Price per KG</dt>
            <dd>{usd.format(Number(instruction.pricePerKgUsd))}</dd>
          </div>
          <div>
            <dt>Transaction value</dt>
            <dd>{usd.format(Number(instruction.transactionValueUsd))}</dd>
          </div>
          <div className={styles.emphasis}>
            <dt>Required settlement</dt>
            <dd>
              {instruction.settlementPercentage}% ·{" "}
              {usd.format(Number(instruction.settlementAmountUsd))}
            </dd>
          </div>
        </dl>

        <p className={styles.purpose}>{instruction.settlementPurpose}</p>
      </section>

      <section className={styles.panel} aria-labelledby="coordinates-heading">
        <div className={styles.sectionHeading}>
          <span>02</span>
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
            </dl>

            <div className={styles.addressBlock}>
              <p>Authorized receiving address</p>
              <code>{instruction.receivingAddress}</code>
              <div className={styles.addressActions}>
                <CopySettlementAddress address={instruction.receivingAddress} />
                <span>Fingerprint {addressFingerprint(instruction.receivingAddress)}</span>
              </div>
            </div>
          </div>

          <figure className={styles.qr}>
            {/* The generated data URL contains only the issued public address. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="QR code for the authorized receiving address" />
            <figcaption>Scan only after independently verifying the network and fingerprint.</figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.standard} aria-labelledby="standard-heading">
        <div className={styles.sectionHeading}>
          <span>03</span>
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
            French-Ward recognizes settlement only after verified receipt on
            the designated network. A screenshot or transaction promise does
            not constitute confirmed receipt.
          </p>
          <p>
            No representative, intermediary, or mandate holder is authorized
            to substitute, modify, or provide an alternative receiving address.
          </p>
        </div>

        <footer className={styles.issuanceFooter}>
          <span>Issued by French-Ward, Inc.</span>
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
