import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const container = 'axpt-postgres-local';
const database = 'arp_profile_inv_qa_' + crypto.randomBytes(6).toString('hex');
let created = false;
let password = '';
let connection = '';
function redact(value) {
  let result = String(value || '');
  for (const secret of [connection, password, encodeURIComponent(password)]) {
    if (secret) result = result.split(secret).join('[REDACTED]');
  }
  return result.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, '[REDACTED_CONNECTION]');
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, timeout: 600000, ...options });
  if (result.error || result.status !== 0) {
    throw new Error(redact(result.stderr || result.error?.message || 'Command failed') + '\n' + redact(result.stdout?.slice(-4000)));
  }
  return result.stdout;
}
try {
  const inspection = JSON.parse(run('docker', ['inspect', container]));
  assert.equal(inspection.length, 1);
  const config = inspection[0];
  assert.equal(config.Name, '/' + container);
  assert.equal(config.State.Running, true);
  const ports = config.NetworkSettings.Ports['5432/tcp'] || [];
  assert.ok(ports.some(item => item.HostPort === '5433'));
  const environment = Object.fromEntries(config.Config.Env.map(item => {
    const split = item.indexOf('='); return [item.slice(0, split), item.slice(split + 1)];
  }));
  assert.equal(environment.POSTGRES_USER, 'axpt');
  password = environment.POSTGRES_PASSWORD;
  assert.ok(password);
  const url = new URL('postgresql://127.0.0.1:5433/' + database);
  url.username = 'axpt'; url.password = password;
  url.searchParams.set('schema', 'public');
  url.searchParams.set('sslmode', 'disable');
  url.searchParams.set('connection_limit', '3');
  url.searchParams.set('connect_timeout', '5');
  url.searchParams.set('pool_timeout', '10');
  connection = url.toString();
  const env = {
    ...process.env, DATABASE_URL: connection, DIRECT_URL: connection,
    DATABASE_URL_UNPOOLED: connection, ARP_PROFILE_INVITATION_LOCAL_TEST: database,
    REPRESENTATIVE_PROFILE_INVITATION_EMAIL_MODE: 'log', REPRESENTATIVE_ONBOARDING_EMAIL_MODE: 'log',
  };
  const ddl = run(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'diff',
    '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { env });
  assert.ok(ddl.includes('CREATE TABLE "RepresentativeProfileIntroduction"'));
  run('docker', ['exec', container, 'psql', '-X', '-U', 'axpt', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c',
    'CREATE DATABASE "' + database + '" OWNER axpt;']);
  created = true;
  run('docker', ['exec', '-i', container, 'psql', '-X', '-q', '-U', 'axpt', '-d', database, '-v', 'ON_ERROR_STOP=1'], { input: ddl });
  console.log('✓ Fresh disposable database created on verified local Docker PostgreSQL.');
  console.log('✓ Schema materialized from the candidate; no live database or migration history changed.');
  const output = run(process.execPath, ['--import', 'tsx', 'scripts/representative-program/acceptRepresentativeProfileInvitationHttp.mjs'], { env });
  process.stdout.write(redact(output));
} catch (error) {
  console.error('Local acceptance stopped:', redact(error.message));
  process.exitCode = 1;
} finally {
  if (created) {
    try {
      assert.match(database, /^arp_profile_inv_qa_[a-f0-9]{12}$/);
      run('docker', ['exec', container, 'psql', '-X', '-U', 'axpt', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c',
        'DROP DATABASE "' + database + '";']);
      console.log('✓ Disposable database and all test fixtures removed.');
    } catch (error) {
      console.error('Local cleanup stopped:', redact(error.message));
      console.error('Preserved disposable database:', database);
      process.exitCode = 1;
    }
  }
}
