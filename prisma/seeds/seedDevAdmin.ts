import { prisma } from '@/infrastructure/db/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'connect@axpt.io'

  if (!email) {
    throw new Error('DEV_ADMIN_EMAIL missing')
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    console.log('✓ Dev admin already exists')
    return
  }

  const passwordHash = await bcrypt.hash('ChangeMeImmediately123!', 10)

  const user = await prisma.user.create({
    data: {
      email,
      username: 'admin',
      passwordHash,
      displayName: 'AXPT Operator',
      isAdmin: true,
      tier: 'ADMIN',
    },
  })

  console.log('✓ Created dev admin:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())