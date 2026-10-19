import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createSupportingDocumentByteCache } = require('../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/supportingDocumentByteCache.ts');
const { readPrivateSupportingBlob } = require('../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/readPrivateSupportingBlob.ts');
const { readSupportingDocument } = require('../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/readSupportingDocument.ts');

let time=0;
const cache=createSupportingDocumentByteCache({maximumBytes:6,maximumEntries:2,ttlMs:100,now:()=>time});
const original=new Uint8Array([1,2,3]);cache.set('a',original);original[0]=9;
const copy=cache.get('a');assert.equal(copy[0],1);copy[0]=8;assert.equal(cache.get('a')[0],1);
cache.set('b',new Uint8Array(3));cache.get('a');cache.set('c',new Uint8Array(3));
assert.equal(cache.get('b'),undefined);assert.ok(cache.get('a'));assert.ok(cache.get('c'));
cache.set('large',new Uint8Array(7));assert.equal(cache.get('large'),undefined);
time=100;assert.equal(cache.get('a'),undefined);assert.equal(cache.get('c'),undefined);cache.clear();

const previousFetch=globalThis.fetch;
const previousToken=process.env.BLOB_READ_WRITE_TOKEN;
const bytes=Buffer.from('%PDF-1.7\nprivate test publication\n');
const sha256=createHash('sha256').update(bytes).digest('hex');
const publication={reference:'CACHE-TEST',version:1,byteLength:bytes.length,sha256};
const fileUrl=`https://zjlswvetvtzvn453.private.blob.vercel-storage.com/arp/supporting-publications/CACHE-TEST/v1/${sha256}.pdf`;
const access={publication,canDownload:false,fileUrl};
let fetches=0,authorizations=0;
const authorize=async()=>{authorizations++;return access;};
const read=()=>readSupportingDocument({action:'VIEW',authorize,read:readPrivateSupportingBlob});
try {
  process.env.BLOB_READ_WRITE_TOKEN='test-only-cache-credential';
  globalThis.fetch=async()=>{fetches++;return new Response(bytes,{headers:{'content-length':String(bytes.length)}});};
  assert.deepEqual(Buffer.from((await read()).bytes),bytes);
  assert.deepEqual(Buffer.from((await read()).bytes),bytes);
  assert.equal(fetches,1);assert.equal(authorizations,4);
  assert.equal(await readSupportingDocument({action:'VIEW',authorize:async()=>null,read:readPrivateSupportingBlob}),null);
  assert.equal(await readSupportingDocument({action:'DOWNLOAD',authorize,read:readPrivateSupportingBlob}),null);
  assert.equal(fetches,1);
  let checks=0;
  assert.equal(await readSupportingDocument({action:'VIEW',authorize:async()=>++checks===1?access:null,read:readPrivateSupportingBlob}),null);
  assert.equal(checks,2);assert.equal(fetches,1);
  checks=0;
  assert.equal(await readSupportingDocument({action:'VIEW',authorize:async()=>++checks===1?access:{...access,publication:{...publication,version:2}},read:readPrivateSupportingBlob}),null);
  assert.equal(checks,2);
  delete process.env.BLOB_READ_WRITE_TOKEN;
  await assert.rejects(read,/SUPPORTING_STORAGE_UNAVAILABLE/);
  process.env.BLOB_READ_WRITE_TOKEN='test-only-rotated-cache-credential';
  await read();assert.equal(fetches,2);
  const corruptUrl=fileUrl.replace(sha256,'0'.repeat(64));
  for(let i=0;i<2;i++) await assert.rejects(()=>readSupportingDocument({action:'VIEW',authorize:async()=>({...access,fileUrl:corruptUrl,publication:{...publication,sha256:'0'.repeat(64)}}),read:readPrivateSupportingBlob}),/SUPPORTING_DOCUMENT_BYTES_DIFFER/);
  assert.equal(fetches,4);
  console.log('SUPPORTING_DOCUMENT_BYTE_CACHE_OK: verified reuse, fresh authorization twice, denied downloads, post-read revocation/content change, missing/rotated credentials, corrupt-byte exclusion, TTL, LRU, byte bounds and defensive copies.');
} finally {
  globalThis.fetch=previousFetch;
  if(previousToken===undefined)delete process.env.BLOB_READ_WRITE_TOKEN;else process.env.BLOB_READ_WRITE_TOKEN=previousToken;
}
