import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('app/(auth)/login/page.tsx', 'utf8');
const helperStart = source.indexOf('function getSafeDestination()');
const helperEnd = source.indexOf('export default function LoginPage()', helperStart);
const routingStart = source.indexOf('      const requestedDestination =');
const routingEnd = source.indexOf('      router.replace(destination)', routingStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'safe destination helper exists');
assert.ok(routingStart >= 0 && routingEnd > routingStart, 'post-verification routing exists');

const code = source.slice(helperStart, helperEnd) +
  '\nfunction resolveDestination(data) {\n' +
  source.slice(routingStart, routingEnd) +
  '\nreturn destination;\n}\nresolveDestination(data);';

function destination(next, audience) {
  return vm.runInNewContext(code, {
    URLSearchParams,
    window: { location: { search: '?next=' + encodeURIComponent(next) } },
    data: { audience },
  });
}

const dossier = '/french-ward/dossiers/d733084a-faf5-471a-8eca-2207385808b9';
const publication = dossier + '/publications/item-123';
for (const audience of ['ADMIN', 'REPRESENTATIVE', 'INSTITUTIONAL_VISITOR', 'FRENCH_WARD_GOVERNING', 'FRENCH_WARD_INSTITUTIONAL']) {
  assert.equal(destination(dossier, audience), dossier, audience + ' dossier');
  assert.equal(destination(publication, audience), publication, audience + ' publication');
}
assert.equal(destination('/french-ward/transaction-intake', 'INSTITUTIONAL_VISITOR'), '/french-ward/transaction-intake');
assert.equal(destination('//malicious.example/path', 'INSTITUTIONAL_VISITOR'), '/french-ward');
assert.notEqual(destination('/french-ward/dossiers/../../admin', 'INSTITUTIONAL_VISITOR'), '/french-ward/dossiers/../../admin');
assert.notEqual(destination('https://malicious.example/', 'INSTITUTIONAL_VISITOR'), 'https://malicious.example/');
console.log('BUYER_DOSSIER_LOGIN_RETURN_OK: five audiences, dossier/publication returns, existing visitor route, invalid destinations.');
