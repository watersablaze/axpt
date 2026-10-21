import {registerHooks} from 'node:module';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
// Node 24 resolves the source slice without a TypeScript runner or a database connection.
registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL) {
    const candidate = new URL(specifier + '.ts', context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
}});
const {commercialPapers} = await import('../../src/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/catalog.ts');
console.log(JSON.stringify({inspection:'READ_ONLY_CANONICAL_CANDIDATES', inspectedAt:new Date().toISOString(),
  establishesApproval:false, establishesRelease:false,
  papers:commercialPapers().map(({key,reference,version,title,status,referenceStatus,contentHash}) =>
    ({key,reference,version,title,status,referenceStatus,contentHash})),
  note:'These hashes cover canonical structured content, including edition and status. Final visual/HTML rendition conformity requires separate acceptance.'
}, null, 2));
