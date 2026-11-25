import assert from "node:assert/strict";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BulletinEditorialBody } from
  "../../app/french-ward/home/BulletinEditorialBody";
import { encodeEditorialBody } from
  "../../app/french-ward/home/bulletinEditorial";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed++;
  console.log(`PASS ${name}`);
}

function render(body: string): string {
  return renderToStaticMarkup(
    React.createElement(BulletinEditorialBody, { body }),
  );
}

console.log(`Runtime: ${process.version}`);

check("Node 24 runtime", () => {
  assert.equal(process.versions.node.split(".")[0], "24");
});

check("editorial headings and emphasis", () => {
  const html = render(
    encodeEditorialBody("## Officers\n\n**Jamal**"),
  );
  assert.match(html, /<h2/);
  assert.match(html, /<strong>Jamal<\/strong>/);
});

check("editorial lists", () => {
  const html = render(
    encodeEditorialBody("- Bobby\n- Ma’yá"),
  );
  assert.match(html, /<ul/);
  assert.match(html, /<li>Bobby<\/li>/);
});

check("legacy content stays plain text", () => {
  const html = render("**Historical notice**");
  assert.ok(html.includes("**Historical notice**"));
  assert.ok(!html.includes("<strong>"));
});

check("raw HTML does not execute", () => {
  const html = render(
    encodeEditorialBody("<script>alert(1)</script>\n\nNotice"),
  );
  assert.ok(!html.includes("<script"));
});

check("script links are rejected", () => {
  const html = render(
    encodeEditorialBody("[Open](javascript:alert%281%29)"),
  );
  assert.ok(!html.includes("javascript:"));
});

check("safe HTTPS links render", () => {
  const html = render(
    encodeEditorialBody("[Meeting](https://example.com/meeting)"),
  );
  assert.match(html, /href="https:\/\/example.com\/meeting"/);
});

check("plain text is escaped", () => {
  const html = render("<img src=x onerror=alert(1)>");
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img"));
});

console.log(`\n${passed}/${passed} renderer checks PASS`);
