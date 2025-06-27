import 'dotenv/config';
import chalk from 'chalk';

const requiredVars = ['PARTNER_SECRET'];

let hasError = false;

for (const key of requiredVars) {
  if (!process.env[key]) {
    console.log(chalk.red(`❌ Missing: ${key}`));
    hasError = true;
  } else {
    console.log(chalk.green(`✅ ${key} = ${process.env[key]}`));
  }
}

if (hasError) {
  console.log(chalk.yellowBright('\nPlease update your .env file.\n'));
  process.exit(1);
} else {
  console.log(chalk.blueBright('\nAll required environment variables are set.\n'));
}