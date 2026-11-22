import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const CONTRACT = Object.freeze([
  {
    mt: 100,
    format: "pdf",
    sha256: "9ed96d9421a6913c971aabeb6b4b48df0b6ac5fd05d8d5c1a46c64175904cf6b",
  },
  {
    mt: 100,
    format: "html",
    sha256: "6d74ac3b817d4bf44bac764abdc1b568a4d842eecfbc52bb20fff5aae2d67037",
  },
  {
    mt: 1000,
    format: "pdf",
    sha256: "d269fa618be345b4d6bd53a9f713a1af9414b5a0b30d958abdd109949bba92be",
  },
  {
    mt: 1000,
    format: "html",
    sha256: "18e30c384aeb8f31cf98656ccaa8a5353fde3907739a568dc0131542f6172993",
  },
]);

const sha = bytes =>
  createHash("sha256").update(bytes).digest("hex");

const stop = message => {
  throw new Error(`GSAM_ED2_CUSTODY_STOP: ${message}`);
};

export async function validateGsamEdition2Stage({
  directory,
  readBytes = readFile,
  stat = lstat,
}) {
  if (typeof directory !== "string" || !directory.trim()) {
    stop("missing staging directory");
  }

  const root = resolve(directory);
  const manifestPath = join(root, "manifest.json");
  const manifestStat = await stat(manifestPath).catch(() =>
    stop("manifest unavailable")
  );

  if (!manifestStat.isFile() || manifestStat.isSymbolicLink()) {
    stop("unsafe manifest");
  }

  const manifest = JSON.parse(
    (await readBytes(manifestPath)).toString("utf8")
  );

  if (
    manifest.schema !== "GSAM_ED2_LOCAL_STAGING_V1" ||
    manifest.status !== "FOUR_CLEAN_CANDIDATES_NOT_ISSUED" ||
    !Array.isArray(manifest.artifacts) ||
    manifest.artifacts.length !== 4
  ) {
    stop("manifest contract mismatch");
  }

  const validated = [];

  for (const expected of CONTRACT) {
    const program = `${expected.mt}MT`;

    const matches = manifest.artifacts.filter(item =>
      item.program === program &&
      item.format === expected.format
    );

    if (matches.length !== 1) {
      stop(`missing or duplicate ${program}:${expected.format}`);
    }

    const entry = matches[0];

    const filename =
      `GSAM-SCO-${expected.mt}MT-ED2` +
      (expected.format === "html" ? "-CLEAN" : "") +
      `.${expected.format}`;

    const edition1Reference =
      `GSAM-SCO-PROGRAM-${expected.mt}MT-2026-001`;

    if (
      entry.filename !== filename ||
      entry.reference !== edition1Reference ||
      entry.sha256 !== expected.sha256 ||
      entry.status !== "LOCAL_CANDIDATE" ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes <= 0
    ) {
      stop(`descriptor mismatch ${program}:${expected.format}`);
    }

    const path = join(root, filename);
    const fileStat = await stat(path).catch(() =>
      stop(`artifact unavailable ${filename}`)
    );

    if (
      !fileStat.isFile() ||
      fileStat.isSymbolicLink() ||
      fileStat.size !== entry.bytes
    ) {
      stop(`unsafe artifact metadata ${filename}`);
    }

    const bytes = await readBytes(path);

    if (
      !(bytes instanceof Uint8Array) ||
      bytes.byteLength !== entry.bytes ||
      sha(bytes) !== expected.sha256
    ) {
      stop(`artifact integrity mismatch ${filename}`);
    }

    if (
      expected.format === "pdf" &&
      Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-"
    ) {
      stop(`invalid PDF ${filename}`);
    }

    if (
      expected.format === "html" &&
      !/^\s*<!doctype html/i.test(
        Buffer.from(bytes.subarray(0, 256)).toString("utf8")
      )
    ) {
      stop(`invalid HTML ${filename}`);
    }

    validated.push({
      quantityMt: expected.mt,
      reference: `GSAM-SCO-PROGRAM-${expected.mt}MT-2026-002`,
      format: expected.format,
      sha256: expected.sha256,
      bytes,
      size: entry.bytes,
      key: `gsam/sco/sha256/${expected.sha256}.${expected.format}`,
    });
  }

  return validated;
}

export async function executeGsamEdition2Custody({
  directory,
  preserve,
  readBytes,
  stat,
}) {
  if (typeof preserve !== "function") {
    stop("missing preservation adapter");
  }

  // Verify all four artifacts before allowing any storage write.
  const validated = await validateGsamEdition2Stage({
    directory,
    readBytes,
    stat,
  });

  const receipt = {
    schema: "GSAM_ED2_CUSTODY_ATTEMPT_V1",
    registry_mutated: false,
    recipient_grants_mutated: false,
    email_sent: false,
    status: "INCOMPLETE",
    artifacts: [],
  };

  for (const artifact of validated) {
    try {
      const result = await preserve({
        format: artifact.format,
        expectedSha256: artifact.sha256,
        bytes: artifact.bytes,
      });

      if (
        !result ||
        result.key !== artifact.key ||
        result.sha256 !== artifact.sha256 ||
        !["created", "exists"].includes(result.disposition)
      ) {
        stop(
          `invalid preservation receipt ${artifact.quantityMt}:${artifact.format}`
        );
      }

      receipt.artifacts.push({
        quantityMt: artifact.quantityMt,
        reference: artifact.reference,
        format: artifact.format,
        sha256: artifact.sha256,
        bytes: artifact.size,
        storageKey: artifact.key,
        disposition: result.disposition,
        readbackVerifiedByAdapter: true,
      });
    } catch (error) {
      receipt.status = "FAILED_PARTIAL_POSSIBLE";
      receipt.error = String(
        error instanceof Error ? error.message : error
      );
      return receipt;
    }
  }

  receipt.status = "PRESERVATION_ADAPTER_ACCEPTED";
  return receipt;
}
