import assert from "node:assert/strict";

import {
  ExternalIntakeHttpError,
  parseExternalIntakeOperatorForm,
  readBoundedExternalIntakeForm,
  validateExternalIntakeRequest,
} from "../../src/domains/control-center/transaction-intakes/parseExternalIntakeOperatorRequest";

const names = {
  operationalReference: "FW-TXN-SYNTHETIC-HTTP",
  submitterName: "Synthetic Source",
  submitterEmail: "source@example.test",
  submitterRole: "INTERMEDIARY_UNVERIFIED",
  buyerName: "Synthetic Buyer",
  commodity: "Gold Dore",
  trialQuantity: "50 kg",
  monthlyQuantity: "50-100 kg",
  destination: "Dubai",
  originatingCandidateName: "Synthetic Candidate",
  deliveryTerms: "Proposed, not accepted",
  settlementMethod: "Unverified",
  confirmation: "REGISTER EXTERNAL INTAKE",
};

function form() {
  const data = new FormData();

  for (const [key, value] of Object.entries(names)) {
    data.append(key, value);
  }

  data.append(
    "evidencePdf",
    new File(
      [Buffer.from("%PDF-1.7\nSYNTHETIC\n%%EOF")],
      "synthetic.pdf",
      { type: "application/pdf" },
    ),
  );

  return data;
}

function request(origin: string, headers: Record<string, string> = {}) {
  return new Request("https://axpt.example.test/api/admin/transaction-intakes/external-import", {
    method: "POST",
    headers: {
      origin,
      host: "axpt.example.test",
      "content-type": "multipart/form-data; boundary=synthetic",
      ...headers,
    },
  });
}

function rejectReason(operation: () => unknown, reason: string) {
  assert.throws(
    operation,
    (error: unknown) =>
      error instanceof ExternalIntakeHttpError &&
      error.reason === reason,
  );
}

async function main() {
  validateExternalIntakeRequest(
    request("https://axpt.example.test"),
  );

  console.log("PASS: matching origin accepted");

  rejectReason(
    () => validateExternalIntakeRequest(
      request("https://other.example.test"),
    ),
    "REQUEST_ORIGIN_MISMATCH",
  );

  rejectReason(
    () => validateExternalIntakeRequest(
      request("https://axpt.example.test", {
        host: "unexpected.example.test",
      }),
    ),
    "REQUEST_HOST_MISMATCH",
  );

  rejectReason(
    () => validateExternalIntakeRequest(
      request("https://axpt.example.test", {
        "content-length": "27000000",
      }),
    ),
    "REQUEST_TOO_LARGE",
  );

  rejectReason(
    () => validateExternalIntakeRequest(
      request("https://axpt.example.test", {
        "content-type": "application/json",
      }),
    ),
    "MULTIPART_REQUIRED",
  );

  console.log("PASS: origin, host, size and content-type guards");

  const parsed = parseExternalIntakeOperatorForm(form());

  assert.equal(parsed.registration.source, "EXTERNAL_EMAIL");
  assert.equal(parsed.registration.buyerName, "Synthetic Buyer");
  assert.equal(parsed.evidencePdf.size > 5, true);

  console.log("PASS: external-import fields parsed");

  const forged = form();
  forged.append("sourceEvidenceReference", "forged/object/key");

  rejectReason(
    () => parseExternalIntakeOperatorForm(forged),
    "UNEXPECTED_OR_DUPLICATE_FIELD",
  );

  const repeated = form();
  repeated.append("buyerName", "Override");

  rejectReason(
    () => parseExternalIntakeOperatorForm(repeated),
    "UNEXPECTED_OR_DUPLICATE_FIELD",
  );

  console.log("PASS: forged custody and duplicate fields rejected");

  const missing = form();
  missing.delete("evidencePdf");

  rejectReason(
    () => parseExternalIntakeOperatorForm(missing),
    "EVIDENCE_PDF_REQUIRED",
  );

  console.log("PASS: missing evidence rejected");

  const multipart = new Request(
    "https://axpt.example.test/api/admin/transaction-intakes/external-import",
    { method: "POST", body: form() },
  );

  const boundedForm = await readBoundedExternalIntakeForm(multipart);
  const boundedParsed = parseExternalIntakeOperatorForm(boundedForm);

  assert.equal(
    boundedParsed.registration.buyerName,
    "Synthetic Buyer",
  );

  console.log("PASS: actual multipart body parsed within limit");

  const oversized = new Request(
    "https://axpt.example.test/api/admin/transaction-intakes/external-import",
    {
      method: "POST",
      body: "SYNTHETIC OVERSIZED BODY",
      headers: { "content-type": "multipart/form-data; boundary=test" },
    },
  );

  await assert.rejects(
    readBoundedExternalIntakeForm(oversized, 8),
    (error: unknown) =>
      error instanceof ExternalIntakeHttpError &&
      error.reason === "REQUEST_TOO_LARGE" &&
      error.status === 413,
  );

  console.log("PASS: actual byte limit enforced without Content-Length");


  console.log("PASS: FW-TXN-1B.3G.2 HTTP guard contract");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
