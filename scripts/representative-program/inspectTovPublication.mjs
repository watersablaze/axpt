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
  "src/components/french-ward/transaction-overview/FrenchWardTransactionOverviewView.module.css": "ad56479e4abf83774827d63fc06b4356b6d5dee892683b652e5c688d2f43a18b",
  "src/components/french-ward/transaction-overview/FrenchWardTransactionOverviewView.tsx": "ca35c2c816f316d7eb902cf60e4f6987469b58289674d6a6f0f9bcc30c221a5c",
  "src/domains/institutions/french-ward/frenchWardTransactionOverview.ts": "74c5333c4166d316c08e2b5e4ae12e4938c0d10b45d974e893d9da987dcf50ae",
  "src/domains/institutions/french-ward/tovGraphiteImageData.ts": "7368329af0d8831cae99dbb57686fa22d44936730a54cc01556c0f016bd8506d",
  "src/domains/institutions/french-ward/renderFrenchWardTransactionOverviewHtml.ts": "bb77c33221c150a638db405dd700823528abe969adc93a0b8deadf6d924c4ebe",
  "public/french-ward/commercial-papers/tov-etched-documentary-marks.svg": "a0267a9400e43460e5334380658f7cbb7a7fd76efc9f5dcf48badc5ee11050e1",
  "public/french-ward/commercial-papers/tov-dore-graphite.webp": "8a90220f469f1847539019db7f26b261a6cc3b3ae55990c0124c1b531add9c30",
  "src/domains/institutions/french-ward/tovPublication.ts": "01ad2b8254b1006b63609668a99954c1b3e896782b52de04c2423921ffdeee6b",
  "src/domains/institutions/french-ward/tovPublicationLegacy.ts": "3005128aec5b983f017774f73081b43f7f90a852ee541bc15a913f33a4fb4d4f",
  "src/domains/institutions/french-ward/tovRepresentativeCopy.ts": "d4810d15135435ddeb0cf4f9e3d0a30b0c5666fb7b011fa7ecbbebcb0a6f60ec"
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
