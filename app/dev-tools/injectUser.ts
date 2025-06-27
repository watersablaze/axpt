// app/dev-tools/injectUser.ts
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { customAlphabet } from 'nanoid';
import chalk from 'chalk';

const nanoid = customAlphabet('1234567890abcdef', 12);

// CLI usage: pnpm tsx dev-tools/injectUser.ts <email> [pin] [tier]
async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const pin = args[1] || Math.floor(1000 + Math.random() * 9000).toString(); // Default: random 4-digit PIN
  const tier = args[2] || 'Nomad';

  if (!email) {
    console.error(chalk.red('❌ Missing email argument'));
    console.info(chalk.gray('Usage: pnpm tsx dev-tools/injectUser.ts <email> [pin] [tier]'));
    process.exit(1);
  }

  const username = email.split('@')[0];
  const accessToken = nanoid();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.warn(chalk.yellow(`⚠️ User already exists with email: ${email}`));
    process.exit(1);
  }

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: pin,
      name: username,
      isAdmin: false,
      tier,
      accessToken,
    },
  });

  console.log(chalk.green(`✅ Created user: ${user.email}`));
  console.log(chalk.cyan(`🔑 PIN: ${pin}`));
  console.log(chalk.magenta(`🪙 Access Token: ${accessToken}`));
  console.log(chalk.gray(`📛 Tier: ${tier}`));
}

main()
  .catch((e) => {
    console.error(chalk.red('❌ Failed to create user'), e);
    process.exit(1);
  })
  .finally(() => process.exit());