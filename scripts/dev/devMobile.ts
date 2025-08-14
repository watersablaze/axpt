#!/usr/bin/env tsx

import { execSync } from 'child_process';
import chalk from 'chalk';

// Use native fetch (Node 18+)
const fetch = globalThis.fetch!;

async function main() {
  console.log(chalk.blue('🔁 Restarting ngrok tunnel...\n'));
  try {
    execSync('pkill -f ngrok || true', { stdio: 'ignore' });
    execSync('pnpm ngrok &', { stdio: 'ignore' });
  } catch (err) {
    console.warn('⚠️ ngrok already running or failed to stop.');
  }

  // Wait for ngrok to start
  await new Promise((r) => setTimeout(r, 2000));

  console.log(chalk.gray('🌐 Fetching ngrok forwarding URL...'));
  const res = await fetch('http://127.0.0.1:4040/api/tunnels');
  const data = await res.json();

  const httpsUrl = data.tunnels.find((t: any) => t.public_url.startsWith('https'))?.public_url;
  if (!httpsUrl) {
    console.error(chalk.red('❌ Could not retrieve https tunnel URL.'));
    process.exit(1);
  }

  // Example: Generate a dummy token or pull from session
  const token = 'TBD_YOUR_TEST_TOKEN';

  console.log(chalk.green('\n✅ Ready for Mobile Access:\n'));
  console.log(`${chalk.bgCyan.black(' 1. ')} Open on mobile:\n  ${chalk.yellow(`${httpsUrl}/onboard/investor?token=${token}`)}\n`);
  console.log(`${chalk.bgMagenta.black(' 2. ')} Or scan your CLI QR\n`);

  // Optional: Create QR code or auto-open browser here
}

main();