import assert from "node:assert/strict";

import {
  BULLETIN_BODY_LIMIT,
  BULLETIN_EDITORIAL_V1_PREFIX,
  decodeBulletinBody,
  prepareBulletinSubmission,
} from "../../app/french-ward/home/bulletinEditorial";

let passed = 0;

function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`PASS ${name}`);
}

check("ordinary plain-text submission", () => {
  assert.equal(
    prepareBulletinSubmission("  Meeting notice  ", "plain"),
    "Meeting notice",
  );
});

check("editorial submission roundtrip", () => {
  const stored = prepareBulletinSubmission(
    "  ## Meeting\n\n**Officers**  ",
    "editorial-v1",
  );
  assert.ok(stored);
  assert.deepEqual(decodeBulletinBody(stored), {
    format: "editorial-v1",
    text: "## Meeting\n\n**Officers**",
  });
});

check("missing format rejected", () => {
  assert.equal(
    prepareBulletinSubmission("Meeting", undefined),
    null,
  );
});

check("unknown format rejected", () => {
  assert.equal(
    prepareBulletinSubmission("Meeting", "html"),
    null,
  );
});

check("nonstring body rejected", () => {
  assert.equal(
    prepareBulletinSubmission({}, "plain"),
    null,
  );
});

check("empty content rejected", () => {
  assert.equal(
    prepareBulletinSubmission("  ", "editorial-v1"),
    null,
  );
});

check("reserved plain-text marker rejected", () => {
  assert.equal(
    prepareBulletinSubmission(
      BULLETIN_EDITORIAL_V1_PREFIX + "Meeting",
      "plain",
    ),
    null,
  );
});

check("exact plain-text limit accepted", () => {
  const body = "x".repeat(BULLETIN_BODY_LIMIT);
  assert.equal(
    prepareBulletinSubmission(body, "plain")?.length,
    BULLETIN_BODY_LIMIT,
  );
});

check("editorial storage limit enforced", () => {
  const allowed =
    "x".repeat(
      BULLETIN_BODY_LIMIT -
      BULLETIN_EDITORIAL_V1_PREFIX.length,
    );

  assert.equal(
    prepareBulletinSubmission(
      allowed,
      "editorial-v1",
    )?.length,
    BULLETIN_BODY_LIMIT,
  );

  assert.equal(
    prepareBulletinSubmission(
      allowed + "x",
      "editorial-v1",
    ),
    null,
  );
});

console.log(`\n${passed}/${passed} save contract checks PASS`);
