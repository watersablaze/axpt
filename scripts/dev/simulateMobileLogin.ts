#!/usr/bin/env tsx

import { execSync } from 'child_process';
import fetch from 'node-fetch';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';

const dummyToken = 'YOUR_GENERATED_TEST_TOKEN';
const route = 'onboard/investor/dashboard';

type NgrokTunnelResponse = {
  tunnels: { public_url: string }[];
};

async function restartNgrok(): Promise<string> {
  console.log(chalk.gray('🔄 Restarting ngrok tunnel...'));

  try {
    execSync('pkill -f ngrok || true', { stdio: 'ignore' });
    execSync('pnpm ngrok &', { stdio: 'ignore' });
    await new Promise((r) => setTimeout(r, 3000));
  } catch {
    console.warn(chalk.yellow('⚠️ ngrok may already be running'));
  }

  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels');
    const data = (await res.json()) as NgrokTunnelResponse;
    const httpsUrl = data.tunnels.find((t) =>
      t.public_url?.startsWith('https')
    )?.public_url;

    if (!httpsUrl) throw new Error();
    return httpsUrl;
  } catch {
    throw new Error(chalk.red('❌ Could not retrieve ngrok tunnel. Is it running?'));
  }
}

async function main() {
  console.log(chalk.cyan.bold('\n📲 Simulate Mobile Login\n'));

  const ngrokUrl = await restartNgrok();
  const mobileUrl = `${ngrokUrl}/${route}?token=${dummyToken}`;

  console.log(chalk.green('\n✅ Mobile Access Link'));
  console.log(chalk.yellowBright(`👉 ${mobileUrl}\n`));

  console.log(chalk.magenta('📱 QR Code (scan on mobile):\n'));
  qrcode.generate(mobileUrl, { small: true });

  setInterval(() => {
    fetch(`${ngrokUrl}/api/ping`).catch(() => {});
  }, 60_000);
}

main().catch((err) => {
  console.error(chalk.redBright('💥 Error during simulation:\n'), err);
});