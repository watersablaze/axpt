#!/usr/bin/env -S tsx

// AXPT | Token CLI Unified Entry

import { argv } from 'node:process';
import { spawn } from 'node:child_process';
import { generateSignedToken } from '../app/scripts/partner/utils/signToken';
import { getEnv } from '@/lib/utils/readEnv';
import partnerTiers from '@/config/partnerTiers.json';
import tierDocs from '@/config/tierDocs.json';

const [,, command, ...args] = argv;
const PARTNER_SECRET = getEnv('PARTNER_SECRET');

type Tier = keyof typeof tierDocs;

const usage = () => {
  console.log(`\n🔐 AXPT Token CLI
------------------
Usage:
  bin/token generate               # Launch prompt to create new token
  bin/token verify <token>        # Verify a token locally
  bin/token list                  # List all partners and tiers
  bin/token lookup <partner>      # Lookup partner tier info
`);
};

const normalize = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

async function run() {
  switch (command) {
    case 'generate': {
      const rawInput = args[0];
      const partnerName = rawInput?.startsWith('--partner=')
        ? rawInput.split('=')[1]
        : undefined;

      const partnerRaw = partnerName || (await prompt('Enter Partner Name (raw, e.g. Jane Doey): '));
      const normalized = normalize(partnerRaw);
      
      type PartnerTiers = Record<string, { tier: string; displayName: string; greeting: string }>;
      const tiers = partnerTiers as PartnerTiers;
      const tierEntry = tiers[normalized];

      if (!tierEntry) {
        console.error(`❌ Partner not found in partnerTiers.json`);
        process.exit(1);
      }

      const tier = tierEntry.tier as Tier;
      const payload = {
        partner: normalized,
        tier,
        docs: tierDocs[tier] || [],
        iat: Date.now()
      };

      const json = JSON.stringify(payload);
      const encoded = Buffer.from(json).toString('base64');
      const sig = generateSignedToken(json, PARTNER_SECRET);
      const token = `${encoded}:${sig}`;

      console.log(`\n✅ Token for ${partnerRaw} → ${tier}\n`);
      console.log(token);

      if (args.includes('--livecheck') || !rawInput) {
        console.log(`\n🌐 Running live verification...`);
        spawn('bin/token-debug-live', [token], { stdio: 'inherit' });
      }
      break;
    }
    case 'verify': {
      const token = args[0];
      if (!token) return usage();
      const [encodedPayload, providedSig] = token.split(':');
      const json = Buffer.from(encodedPayload, 'base64').toString('utf8');
      const expectedSig = generateSignedToken(json, PARTNER_SECRET);
      if (providedSig === expectedSig.signature) {
        console.log(`\n✅ Token is valid`);
        console.log(JSON.parse(json));
      } else {
        console.error(`❌ Token is invalid.`);
      }
      break;
    }
    case 'list': {
      console.log(`\n📜 Known Partners:`);
      Object.entries(partnerTiers).forEach(([name, obj]: any) => {
        console.log(`• ${name} → ${obj.tier}`);
      });
      break;
    }
    case 'lookup': {
      const p = normalize(args[0] || '');
      const entry = (partnerTiers as any)[p];
      if (!entry) return console.log(`❌ No such partner.`);
      console.log(`\n🎯 ${p} → ${entry.tier}`);
      break;
    }
    default:
      usage();
  }
}

function prompt(msg: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(`? ${msg}`);
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });
}

run();
