import assert from "node:assert/strict";

import {
  BULLETIN_BODY_LIMIT,
  BULLETIN_EDITORIAL_V1_PREFIX,
  decodeBulletinBody,
  encodeEditorialBody,
  safeBulletinHref,
} from "../../app/french-ward/home/bulletinEditorial";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed++;
  console.log(`PASS ${name}`);
}

check("legacy plain text remains plain text", () => {
  assert.deepEqual(
    decodeBulletinBody("**Not Markdown**\nSecond line"),
    {
      format: "plain",
      text: "**Not Markdown**\nSecond line",
    },
  );
});

check("editorial content roundtrips exactly", () => {
  const source = "## Officers\n\n- Bobby\n- Jamal";
  assert.deepEqual(
    decodeBulletinBody(encodeEditorialBody(source)),
    {
      format: "editorial-v1",
      text: source,
    },
  );
});

check("unknown format remains plain text", () => {
  const source = "\u001eFW-BULLETIN-EDITORIAL-V2\nText";
  assert.equal(decodeBulletinBody(source).format, "plain");
});

check("empty editorial content rejected", () => {
  assert.throws(() => encodeEditorialBody("   "));
});

check("oversized editorial content rejected", () => {
  assert.throws(() =>
    encodeEditorialBody("x".repeat(BULLETIN_BODY_LIMIT)),
  );
});

check("editorial marker is explicit", () => {
  assert.ok(
    encodeEditorialBody("Test").startsWith(
      BULLETIN_EDITORIAL_V1_PREFIX,
    ),
  );
});

check("safe HTTPS link accepted", () => {
  assert.equal(
    safeBulletinHref("https://example.com/meeting"),
    "https://example.com/meeting",
  );
});

check("internal relative link accepted", () => {
  assert.equal(
    safeBulletinHref("/french-ward/home?module=bulletin"),
    "/french-ward/home?module=bulletin",
  );
});

check("script URL rejected", () => {
  assert.equal(
    safeBulletinHref("javascript:alert(1)"),
    undefined,
  );
});

check("protocol-relative URL rejected", () => {
  assert.equal(
    safeBulletinHref("//example.com"),
    undefined,
  );
});

check("unsafe controls rejected", () => {
  assert.equal(
    safeBulletinHref("https://example.com/\nattack"),
    undefined,
  );
});

check("insecure HTTP URL rejected", () => {
  assert.equal(
    safeBulletinHref("http://example.com"),
    undefined,
  );
});

console.log(`\n${passed}/${passed} editorial contract checks PASS`);
