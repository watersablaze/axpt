import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readSupportingDocument } from "../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/readSupportingDocument.ts";
const bytes=Buffer.from("%PDF-local-fixture");
const publication={reference:"FW-TEST-001",version:1,byteLength:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")};
const access={publication,canDownload:false,fileUrl:`https://zjlswvetvtzvn453.private.blob.vercel-storage.com/arp/supporting-publications/${publication.reference}/v1/${publication.sha256}.pdf`};
let reads=0;const read=async()=>{reads++;return bytes;};
assert.equal(await readSupportingDocument({action:"VIEW",authorize:async()=>null,read}),null);
assert.equal(await readSupportingDocument({action:"DOWNLOAD",authorize:async()=>access,read}),null);
assert.equal(reads,0);
for(const fileUrl of ["https://example.invalid/test.pdf",access.fileUrl+"?token=bad",access.fileUrl.replace("/v1/","/v2/")]) {
 await assert.rejects(()=>readSupportingDocument({action:"VIEW",authorize:async()=>({...access,fileUrl}),read}),/LOCATOR_INVALID/);
}
assert.equal(reads,0);
assert.deepEqual((await readSupportingDocument({action:"VIEW",authorize:async()=>access,read})).bytes,bytes);
await assert.rejects(()=>readSupportingDocument({action:"VIEW",authorize:async()=>access,read:async()=>Buffer.from("%PDF-wrong")}),/BYTES_DIFFER/);
let checks=0;
assert.equal(await readSupportingDocument({action:"VIEW",authorize:async()=>++checks===1?access:null,read}),null);
assert.ok(await readSupportingDocument({action:"DOWNLOAD",authorize:async()=>({...access,canDownload:true}),read}));
console.log("SUPPORTING_DOCUMENT_ACCESS_OK: deny before storage, private locator, exact bytes, post-read revocation and independent download permission.");
