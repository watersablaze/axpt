import assert from "node:assert/strict";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  validateGsamEdition2Stage,
  executeGsamEdition2Custody,
} from "./gsamEdition2CustodyExecutor.mjs";

const stage = join(
  homedir(),
  "Desktop",
  "gsam-ed2-custody-stage"
);

const mode = process.argv[2] ?? "preflight";

if (!["preflight", "preserve"].includes(mode)) {
  throw new Error("STOP: Invalid execution mode");
}

const artifacts = await validateGsamEdition2Stage({
  directory: stage,
});

assert.equal(artifacts.length, 4);

console.log("GSAM ED2 — CUSTODY RUNNER");
console.log(`Mode: ${mode}`);
console.log(`Validated artifacts: ${artifacts.length}`);

for (const artifact of artifacts) {
  console.log(
    `${artifact.reference} ${artifact.format} ${artifact.sha256}`
  );
}

if (mode === "preflight") {
  console.log("PREFLIGHT PASSED — NO STORAGE WRITES");
  process.exit(0);
}

if (
  process.env.GSAM_ED2_PRODUCTION_PRESERVE !==
  "AUTHORIZE_FOUR_CONDITIONAL_WRITES"
) {
  throw new Error("STOP: Production preservation not authorized");
}

const required = {
  endpoint: process.env.AWS_ENDPOINT_URL_S3?.trim(),
  region: process.env.AWS_REGION?.trim(),
  accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim(),
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  bucket: process.env.AXPT_TRANSACTION_DOCUMENT_BUCKET?.trim(),
};

if (Object.values(required).some(value => !value)) {
  throw new Error("STOP: Incomplete Production storage configuration");
}

// Load Production storage dependencies only after explicit authorization.
const custodyModule = await import(
  "../../src/domains/instruments/transaction-documents/gsamWriteOnceCustody.ts"
);

const storageModule = await import(
  "../../src/domains/instruments/transaction-documents/gsamConditionalS3Store.ts"
);

const preserveGsamWriteOnceArtifact =
  custodyModule.preserveGsamWriteOnceArtifact ??
  custodyModule.default?.preserveGsamWriteOnceArtifact;

const createGsamConditionalS3Store =
  storageModule.createGsamConditionalS3Store ??
  storageModule.default?.createGsamConditionalS3Store;

if (
  typeof preserveGsamWriteOnceArtifact !== "function" ||
  typeof createGsamConditionalS3Store !== "function"
) {
  throw new Error("STOP: Production custody adapters unavailable");
}

const store = createGsamConditionalS3Store(required);

const receipt = await executeGsamEdition2Custody({
  directory: stage,
  preserve: params =>
    preserveGsamWriteOnceArtifact({
      store,
      ...params,
    }),
});

const safeReceipt = {
  ...receipt,
  error: receipt.error ? "PRESERVATION_FAILED" : undefined,
};

console.log(JSON.stringify(safeReceipt, null, 2));

if (
  receipt.status !== "PRESERVATION_ADAPTER_ACCEPTED" ||
  receipt.artifacts.length !== 4 ||
  !receipt.artifacts.every(
    artifact => artifact.readbackVerifiedByAdapter === true
  )
) {
  throw new Error("STOP: Production custody incomplete");
}

console.log("FOUR ARTIFACTS PRESERVED AND READ-BACK VERIFIED");
console.log("REGISTRY AND RECIPIENT ACCESS UNCHANGED");
