// app/dev-tools/createTestUser.ts
import 'tsconfig-paths/register';
import prisma from '../src/lib/prisma';

async function create() {
  const user = await prisma.user.create({
    data: {
      username: 'demoUser',
      password: 'demoPass',
      email: 'demo@example.com',
      accessToken: 'demo-token',
      tier: 'Investor',
    },
  });

  console.log('🔧 Demo user created:', user);
}

create().finally(() => prisma.$disconnect());