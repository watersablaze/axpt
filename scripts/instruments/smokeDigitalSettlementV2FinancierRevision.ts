import assert from "node:assert/strict";

import { buildDigitalSettlementV2EmailPreviews } from "../../src/domains/instruments/communications/digitalSettlementV2Preview";
import {
  DIGITAL_SETTLEMENT_V2_RECIPIENTS,
  DSI_V2_FINANCIER_REVISION,
} from "../../src/domains/instruments/definitions/digitalSettlementV2FinancierRevision";

const previews = buildDigitalSettlementV2EmailPreviews({
  accessUrls: {
    financier:
      "https://www.axpt.io/french-ward/instruments/fw-dsi-2026-001/access/[CARL-PRIVATE-TOKEN]",
    buyerRepresentative:
      "https://www.axpt.io/french-ward/instruments/fw-dsi-2026-001/access/[COREY-REVIEW-TOKEN]",
    externalReviewer:
      "https://www.axpt.io/french-ward/instruments/fw-dsi-2026-001/access/[HINDS-REVIEW-TOKEN]",
    bobby:
      "https://www.axpt.io/french-ward/instruments/fw-dsi-2026-001/access/[BOBBY-REVIEW-TOKEN]",
    lawrence:
      "https://www.axpt.io/french-ward/instruments/fw-dsi-2026-001/access/[LAWRENCE-REVIEW-TOKEN]",
  },
});

assert.equal(DSI_V2_FINANCIER_REVISION.version, 2);
assert.equal(DSI_V2_FINANCIER_REVISION.supersedesVersion, 1);
assert.equal(
  DSI_V2_FINANCIER_REVISION.tapFinancier.name,
  "Carl Albert Meisterlin",
);
assert.equal(
  DSI_V2_FINANCIER_REVISION.tapFinancier.email,
  "meisterlin@aol.com",
);
assert.equal(
  DSI_V2_FINANCIER_REVISION.externalReviewer.name,
  "Dr. Don C. Hinds",
);
assert.equal(
  DSI_V2_FINANCIER_REVISION.externalReviewer.email,
  "DHinds@ibosed.com",
);
assert.equal(
  DIGITAL_SETTLEMENT_V2_RECIPIENTS.buyerRepresentative.email,
  "corey@inderakshgold.com",
);
assert.equal(previews.length, 5);
assert.equal(
  previews.filter((preview) => preview.audience === "ACTIVE").length,
  1,
);
assert.equal(
  previews.find((preview) => preview.audience === "ACTIVE")?.recipientKey,
  "financier",
);

for (const preview of previews) {
  assert.match(preview.html, /Governed through AXPT/);
  assert.match(preview.html, /Current Stage/);
  assert.match(preview.html, /Private instrument:/);
  assert.ok(!preview.html.includes("471812.40 USDT TAP balance"));
  assert.ok(!preview.text.includes("Blockchain observer:"));
  assert.ok(!preview.text.includes("AXPT position:"));
}

assert.equal(
  previews.find(
    (preview) => preview.recipientKey === "buyerRepresentative",
  )?.authority,
  "REVIEW ACCESS · BUYER REPRESENTATIVE",
);
assert.equal(
  previews.find(
    (preview) => preview.recipientKey === "externalReviewer",
  )?.authority,
  "REVIEW ACCESS · PARTICIPANT RECORD",
);
assert.equal(
  previews.find(
    (preview) => preview.recipientKey === "bobby",
  )?.authority,
  "INTERNAL REVIEW · V1 PRESERVED",
);
assert.equal(
  previews.find(
    (preview) => preview.recipientKey === "lawrence",
  )?.authority,
  "FIDUCIARY REVIEW · VERIFICATION STAGE",
);

const financierPreview = previews.find(
  (preview) => preview.recipientKey === "financier",
);
assert.match(financierPreview?.html ?? "", /exactly 50 USDT/);
assert.match(financierPreview?.html ?? "", /471,762.40 USDT/);
assert.match(
  financierPreview?.html ?? "",
  /Mali export-fee stage/,
);

const coreyPreview = previews.find(
  (preview) => preview.recipientKey === "buyerRepresentative",
);
assert.match(
  coreyPreview?.text ?? "",
  /Carl Albert Meisterlin as the financier handling/,
);

const hindsPreview = previews.find(
  (preview) => preview.recipientKey === "externalReviewer",
);
assert.match(
  hindsPreview?.text ?? "",
  /Seller Consultant capacity remains part of the transaction record/,
);

console.log("DIGITAL_SETTLEMENT_V2_FINANCIER_REVISION_PREVIEW_OK");
console.log("V1_HISTORY_AND_COMMERCIAL_SNAPSHOT_PRESERVED_OK");
console.log("ONE_ACTIVE_FINANCIER_FOUR_REVIEW_RECIPIENTS_OK");
