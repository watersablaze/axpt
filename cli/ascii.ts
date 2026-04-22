// cli/ascii.ts
import '@/infrastructure/env/loadEnv';

import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';

export function printAsciiHeader(subtitle = 'Developer CLI Suite') {
  const timestamp = new Date().toLocaleString();
  const version = 'v1.0.0';

  // Stylized ASCII logo
  const title = figlet.textSync('AXPT.io', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.clear();

  // Print gradient header
  console.log(gradient.pastel.multiline(title));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(`${chalk.bold('🛠️  AXPT Internal Tool')}: ${chalk.cyanBright(subtitle)}`);
  console.log(`${chalk.bold('🕰️  Time')}: ${chalk.yellow(timestamp)}`);
  console.log(`${chalk.bold('🧬 Version')}: ${chalk.green(version)}`);
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}