import assert from "node:assert/strict";

import {
  BULLETIN_EDITORIAL_V1_PREFIX,
  prepareBulletinSubmission,
} from "../../app/french-ward/home/bulletinEditorial";

const markdownLF = [
  "## Administrative coordination",
  "",
  "**Bobby:** Logistics",
  "**Jamal:** Strategy",
  "**Ma’yá:** Infrastructure",
  "**Lawrence:** Accountability",
].join("\n");

const markdownCRLF = markdownLF.replace(/\n/g, "\r\n");
const markdownCR = markdownLF.replace(/\n/g, "\r");

assert.equal(
  prepareBulletinSubmission(markdownLF, "editorial-v1"),
  BULLETIN_EDITORIAL_V1_PREFIX + markdownLF,
);
console.log("PASS editorial LF retained");

assert.equal(
  prepareBulletinSubmission(markdownCRLF, "editorial-v1"),
  BULLETIN_EDITORIAL_V1_PREFIX + markdownLF,
);
console.log("PASS browser CRLF normalized");

assert.equal(
  prepareBulletinSubmission(markdownCR, "editorial-v1"),
  BULLETIN_EDITORIAL_V1_PREFIX + markdownLF,
);
console.log("PASS legacy CR normalized");

assert.equal(
  prepareBulletinSubmission(markdownCRLF, "plain"),
  markdownLF,
);
console.log("PASS plain-text line endings normalized");

assert.equal(
  prepareBulletinSubmission(
    "   \r\n   ",
    "editorial-v1",
  ),
  null,
);
console.log("PASS whitespace-only content remains rejected");

console.log("5/5 line-ending checks PASS");
