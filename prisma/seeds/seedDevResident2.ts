import { prisma } from '@/infrastructure/db/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'resident2@axpt.local'

  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    console.log('✓ Dev resident 2 already exists')
    return
  }

  const passwordHash = await bcrypt.hash('ChangeMeImmediately123!', 10)

  const user = await prisma.user.create({
    data: {
      email,
      username: 'resident2',
      passwordHash,
      displayName: 'AXPT Resident 2',
      isAdmin: false,
      tier: 'resident',
    },
  })

  console.log('✓ Created dev resident 2:', user.email)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })