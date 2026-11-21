import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SUPPORTING_DOCUMENTS, findSupportingDocument } from "../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/catalog.ts";
import { verifySupportingDocumentBytes } from "../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/verifySupportingDocumentBytes.ts";
const folder = process.argv[2];
assert.ok(folder, "Supply the local folder containing the three approved PDFs.");
assert.equal(new Set(SUPPORTING_DOCUMENTS.map(entry=>entry.reference)).size,3);
for (const entry of SUPPORTING_DOCUMENTS) {
 const bytes = fs.readFileSync(path.join(folder,entry.sourceFileName));
 const input = {reference:entry.reference,version:entry.version,bytes,document:findSupportingDocument(entry.reference,entry.version)};
 assert.equal(verifySupportingDocumentBytes(input),entry);
 const altered=Buffer.from(bytes); altered[altered.length-1]^=1;
 assert.throws(()=>verifySupportingDocumentBytes({...input,bytes:altered}),/BYTES_DIFFER/);
 assert.throws(()=>verifySupportingDocumentBytes({...input,version:entry.version+1}),/PUBLICATION_UNKNOWN/);
 assert.throws(()=>verifySupportingDocumentBytes({...input,document:null}),/PUBLICATION_UNKNOWN/);
 console.log("✓ Original PDF bytes verified:",entry.kind);
}
console.log("SUPPORTING_DOCUMENT_INTEGRITY_OK: exact originals, tampering and edition mismatch checked; no access or download permissions created.");
