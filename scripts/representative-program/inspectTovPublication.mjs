import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
registerHooks({resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) return next(specifier + ".ts", context);
    throw error;
  }
}});
const root=fileURLToPath(new URL("../../", import.meta.url));
const expected={
  "src/components/french-ward/transaction-overview/tovTradePassagePlate.ts": "736cce345e94f59038714771a745ac9cadb1dc73b48653726293b529f9f03d8b",
  "src/components/french-ward/transaction-overview/FrenchWardTransactionOverviewView.module.css": "89f3eb6f89948b2d8189d187ea77600335082c32797cd1926e784206268e8e74",
  "src/components/french-ward/transaction-overview/FrenchWardTransactionOverviewView.tsx": "dc89a4e44290fcba3ab1a1d8abdd5d6dbd70d0445c8f18ed567c1dd718b168c4",
  "src/domains/institutions/french-ward/frenchWardTransactionOverview.ts": "74c5333c4166d316c08e2b5e4ae12e4938c0d10b45d974e893d9da987dcf50ae",
  "src/domains/institutions/french-ward/tovGraphiteImageData.ts": "7368329af0d8831cae99dbb57686fa22d44936730a54cc01556c0f016bd8506d",
  "src/domains/institutions/french-ward/renderFrenchWardTransactionOverviewHtml.ts": "7393115c0d68a149e2239b5989b0e06db13dbc3da5b45c476a647dec66ebd80a",
  "public/french-ward/commercial-papers/tov-etched-documentary-marks.svg": "a0267a9400e43460e5334380658f7cbb7a7fd76efc9f5dcf48badc5ee11050e1",
  "public/french-ward/commercial-papers/tov-dore-graphite.webp": "8a90220f469f1847539019db7f26b261a6cc3b3ae55990c0124c1b531add9c30",
  "src/domains/institutions/french-ward/tovPublication.ts": "bc2f40e3451a823b9541db050c4be836d67a50b269f543d45f91d78f060459da"
};
for (const [name, hash] of Object.entries(expected)) assert.equal(createHash("sha256").update(readFileSync(resolve(root,name))).digest("hex"),hash,"Publication source changed: "+name);
const { commercialPapers }=await import("../../src/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/catalog.ts");
const paper=commercialPapers().find(p=>p.key==="TRANSACTION_OVERVIEW");
const {TOV_PUBLICATION}=await import("../../src/domains/institutions/french-ward/tovPublication.ts");
assert.equal(paper.contentHash,TOV_PUBLICATION.contentHash);
assert.equal(paper.publicationHash,TOV_PUBLICATION.publicationHash);
const {renderFrenchWardTransactionOverviewHtml:render}=await import("../../src/domains/institutions/french-ward/renderFrenchWardTransactionOverviewHtml.ts");
const css=readFileSync(resolve(root,"src/components/french-ward/transaction-overview/FrenchWardTransactionOverviewView.module.css"),"utf8").replaceAll("/french-ward/commercial-papers/tov-etched-documentary-marks.svg","data:image/svg+xml;base64,"+readFileSync(resolve(root,"public/french-ward/commercial-papers/tov-etched-documentary-marks.svg")).toString("base64"));
const html=render(css), escape=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
assert.equal(html,TOV_PUBLICATION.html,"Current HTML renderer differs from the pinned publication");
assert.ok(html.includes(paper.reference));
assert.ok(html.includes("Edition 01"));
const procedure=paper.content.sections.find(s=>s.id==="standard-transaction-procedure");
assert.equal(procedure.paragraphs.filter(p=>/^\d{2} \| /.test(p)).length,7);
for(const section of paper.content.sections) for(const paragraph of section.paragraphs) {
  // Procedure is split into title/body and continuation paragraphs in both presentations.
  if(section===procedure) continue;
  assert.ok(html.includes(escape(paragraph)),"Missing canonical paragraph: "+section.id);
}
assert.ok(!html.includes("/french-ward/commercial-papers/"),"HTML preview must embed publication assets");
console.log(JSON.stringify({inspection:"READ_ONLY_TOV_PRESENTATION_BASELINE",reference:paper.reference,version:paper.version,contentHash:paper.contentHash,publicationHash:paper.publicationHash,sourceFiles:Object.keys(expected).length,sevenStages:true,establishesVisualAcceptance:false,establishesRelease:false},null,2));
