import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import { renderRepresentativeAppointmentCredential } from "./renderRepresentativeAppointmentCredential";
import type { AppointmentCertificateBasis } from "./issueRepresentativeAppointmentCredential";

export const SIGNATURE_HASH =
  "80169c0c6a46fc165b2999220e9a4cee38e1193d22788deda49c2dfcfe0fbee2";
export const SEAL_HASH =
  "b5387470d30435e040aaae3d59aca784c409dd58a775a9e8c0bf9b1673680bd3";

function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function token() {
  const value = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!value || value.includes("[SENSITIVE]")) {
    throw new Error("[ARP_CERTIFICATE_STORAGE_UNAVAILABLE]");
  }
  return value;
}

function locator(value: string) {
  const url = new URL(value);
  const hostname = process.env.ARP_CERTIFICATE_BLOB_HOSTNAME?.trim() ||
    "zjlswvetvtzvn453.private.blob.vercel-storage.com";
  if (
    url.protocol !== "https:" || url.hostname !== hostname ||
    url.username || url.password || url.port || url.search || url.hash ||
    !url.pathname.startsWith("/arp/appointment-certificates/")
  ) throw new Error("[ARP_CERTIFICATE_STORAGE_LOCATOR_INVALID]");
  return url;
}

export async function readPrivateAppointmentCertificate(
  uri: string,
  expectedHash: string,
) {
  const url = locator(uri);
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) {
    throw new Error("[ARP_CERTIFICATE_HASH_INVALID]");
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("[ARP_CERTIFICATE_STORAGE_READ_FAILED]");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (
    Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-" ||
    hash(bytes) !== expectedHash
  ) throw new Error("[ARP_CERTIFICATE_INTEGRITY_FAILED]");
  return bytes;
}

export async function storePrivateAppointmentCertificate(input: {
  key: string;
  bytes: Uint8Array;
  sha256: string;
}) {
  if (
    hash(input.bytes) !== input.sha256 ||
    !/^arp\/appointment-certificates\/[a-zA-Z0-9_-]+\/[a-f0-9]{64}\.pdf$/.test(input.key)
  ) throw new Error("[ARP_CERTIFICATE_STORAGE_INPUT_INVALID]");

  const blob = await put(input.key, Buffer.from(input.bytes), {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: true,
    allowOverwrite: false,
    token: token(),
  });
  locator(blob.url);
  await readPrivateAppointmentCertificate(blob.url, input.sha256);
  return { uri: blob.url, access: "private" as const };
}

export async function renderIssuableAppointmentCertificate(
  configuration: AppointmentCertificateBasis,
  issuedAt: Date,
) {
  const root = path.join(process.cwd(), "private-assets", "arp");
  const [signature, seal] = await Promise.all([
    readFile(path.join(root, "jamal-ward-signature.png")),
    readFile(path.join(root, "french-ward-seal.png")),
  ]);
  if (hash(signature) !== SIGNATURE_HASH || hash(seal) !== SEAL_HASH) {
    throw new Error("[ARP_CERTIFICATE_ASSET_CONFLICT]");
  }
  return renderRepresentativeAppointmentCredential({
    displayName: configuration.displayName,
    reference: configuration.reference,
    version: configuration.version,
    appointmentClass: configuration.appointmentClass,
    appointmentForm: configuration.appointmentForm,
    effectiveAt: new Date(configuration.effectiveAt),
    expiresAt: configuration.expiresAt,
    generatedAt: issuedAt,
  }, {
    signature, seal, issuedAt, reviewOnly: false,
  });
}
